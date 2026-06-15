from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .utils import blacklist_all_user_tokens, blacklist_request_access_token, normalize_email

User = get_user_model()

GENERIC_LOGIN_ERROR = 'Unable to log in with provided credentials.'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone')
        read_only_fields = fields


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone')

    def validate_email(self, value):
        value = normalize_email(value)
        user = self.context['request'].user
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
        )

    def validate_email(self, value):
        value = normalize_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['email'] = normalize_email(validated_data['email'])

        role = User.Role.STAFF
        valid_roles = {choice[0] for choice in User.Role.choices}
        if role not in valid_roles:
            raise serializers.ValidationError({'role': 'Invalid default role configuration.'})

        user = User(
            **validated_data,
            role=role,
            is_staff=False,
            is_superuser=False,
        )
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(TokenObtainPairSerializer):
    """Accept username or email; always return a generic error on failure."""

    default_error_messages = {
        'no_active_account': GENERIC_LOGIN_ERROR,
    }

    def validate(self, attrs):
        login_value = attrs.get('username', '')
        if '@' in login_value:
            user = User.objects.filter(email__iexact=login_value).first()
            attrs['username'] = user.username if user else login_value

        try:
            return super().validate(attrs)
        except AuthenticationFailed as exc:
            raise AuthenticationFailed(GENERIC_LOGIN_ERROR, code='authorization') from exc


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        validate_password(attrs['new_password'], self.context['request'].user)
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        blacklist_all_user_tokens(user)
        return user


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone')

    def create(self, validated_data):
        password = validated_data.pop('password')
        if 'email' in validated_data:
            validated_data['email'] = normalize_email(validated_data['email'])
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'role', 'phone', 'is_active')

    def validate_email(self, value):
        return normalize_email(value)
