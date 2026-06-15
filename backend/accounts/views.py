import logging

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .permissions import IsAdmin
from .serializers import (
    ChangePasswordSerializer,
    UserCreateSerializer,
    UserLoginSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from .throttling import AuthRateThrottle
from .utils import blacklist_request_access_token

User = get_user_model()
logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserLoginSerializer
    throttle_classes = [AuthRateThrottle]


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        self._blacklist_access_token(request)
        self._blacklist_refresh_token(request)
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)

    def _blacklist_access_token(self, request):
        blacklist_request_access_token(request, raise_on_mismatch=True)

    def _blacklist_refresh_token(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return
        try:
            token = RefreshToken(refresh_token)
            token_user_id = token.payload.get('user_id')
            if token_user_id is None or int(token_user_id) != request.user.id:
                raise PermissionDenied('Token does not belong to the authenticated user.')
            token.blacklist()
        except (TokenError, InvalidToken) as exc:
            raise ValidationError({'detail': 'Invalid or expired refresh token.'}) from exc
        except PermissionDenied:
            raise
        except Exception as exc:
            logger.exception('Unexpected error blacklisting refresh token during logout')
            raise ValidationError({'detail': 'Unable to complete logout.'}) from exc


class UserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=partial,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class MeView(UserView):
    """Backward-compatible alias for the current user endpoint."""

    pass


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        blacklist_request_access_token(request)
        return Response({'detail': 'Password changed successfully.'})


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('username')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {'detail': 'Cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)
