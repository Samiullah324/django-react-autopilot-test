from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import AccessToken


class JWTAuthenticationWithAccessBlacklist(JWTAuthentication):
    """JWT authentication that also rejects blacklisted access tokens."""

    def get_validated_token(self, raw_token):
        validated = super().get_validated_token(raw_token)
        try:
            token = AccessToken(raw_token)
            jti = token[api_settings.JTI_CLAIM]
            if BlacklistedToken.objects.filter(token__jti=jti).exists():
                raise InvalidToken('Token is blacklisted')
        except TokenError as exc:
            raise InvalidToken('Token is blacklisted') from exc
        return validated
