import logging

from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.utils import datetime_from_epoch

logger = logging.getLogger(__name__)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def blacklist_all_user_tokens(user) -> None:
    """Invalidate every outstanding refresh token for the user."""
    for outstanding in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=outstanding)


def blacklist_access_token_string(token_string: str, user) -> None:
    """Add an access token to the blacklist (AccessToken has no blacklist() helper)."""
    try:
        access = AccessToken(token_string)
        jti = access[api_settings.JTI_CLAIM]
        exp = access['exp']
        outstanding, _ = OutstandingToken.objects.get_or_create(
            jti=jti,
            defaults={
                'user': user,
                'token': token_string,
                'expires_at': datetime_from_epoch(exp),
            },
        )
        BlacklistedToken.objects.get_or_create(token=outstanding)
    except (TokenError, InvalidToken):
        logger.warning('Could not blacklist access token for user %s', user.id)


def blacklist_request_access_token(request, *, raise_on_mismatch: bool = False) -> None:
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return
    token_string = auth_header.split(' ', 1)[1]
    try:
        access = AccessToken(token_string)
        token_user_id = access.payload.get('user_id')
        if token_user_id is None or int(token_user_id) != request.user.id:
            if raise_on_mismatch:
                raise PermissionDenied('Token does not belong to the authenticated user.')
            return
        blacklist_access_token_string(token_string, request.user)
    except (TokenError, InvalidToken):
        logger.warning('Could not blacklist access token for user %s', request.user.id)
