from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile, UserRole


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('role', 'phone', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    role = serializers.ChoiceField(choices=UserRole.choices, write_only=True, required=False)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'profile', 'role', 'phone', 'password', 'is_active', 'date_joined',
        )
        read_only_fields = ('id', 'date_joined')

    def create(self, validated_data):
        role = validated_data.pop('role', UserRole.STAFF)
        phone = validated_data.pop('phone', '')
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        user.profile.role = role
        user.profile.phone = phone
        user.profile.save()
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop('role', None)
        phone = validated_data.pop('phone', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if role is not None:
            instance.profile.role = role
        if phone is not None:
            instance.profile.phone = phone
        instance.profile.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.STAFF)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone')

    def create(self, validated_data):
        role = validated_data.pop('role', UserRole.STAFF)
        phone = validated_data.pop('phone', '')
        user = User.objects.create_user(**validated_data)
        user.profile.role = role
        user.profile.phone = phone
        user.profile.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
