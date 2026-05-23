from rest_framework.permissions import BasePermission

from .models import UserRole


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == UserRole.ADMIN
        )


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not hasattr(request.user, 'profile'):
            return False
        return request.user.profile.role in (UserRole.ADMIN, UserRole.MANAGER)


class IsAdminOrManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user.is_authenticated
        if not request.user.is_authenticated or not hasattr(request.user, 'profile'):
            return False
        return request.user.profile.role in (UserRole.ADMIN, UserRole.MANAGER)
