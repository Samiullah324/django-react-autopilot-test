from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()

VALID_PASSWORD = 'SecurePass1'


class AuthAPITestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.logout_url = '/api/auth/logout/'
        self.user_url = '/api/auth/user/'
        self.change_password_url = '/api/auth/change-password/'

    def register_user(self, username='newuser', email='new@example.com'):
        return self.client.post(
            self.register_url,
            {
                'username': username,
                'email': email,
                'password': VALID_PASSWORD,
                'password_confirm': VALID_PASSWORD,
                'first_name': 'New',
                'last_name': 'User',
            },
            format='json',
        )

    def login(self, username='newuser', password=VALID_PASSWORD):
        return self.client.post(
            self.login_url,
            {'username': username, 'password': password},
            format='json',
        )

    def test_registration_success(self):
        response = self.register_user()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='newuser')
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.role, User.Role.STAFF)
        self.assertEqual(user.email, 'new@example.com')

    def test_registration_normalizes_email(self):
        response = self.client.post(
            self.register_url,
            {
                'username': 'mixedcase',
                'email': 'Mixed@Example.COM',
                'password': VALID_PASSWORD,
                'password_confirm': VALID_PASSWORD,
                'first_name': 'Mix',
                'last_name': 'Case',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.get(username='mixedcase').email, 'mixed@example.com')

    def test_registration_duplicate_email(self):
        self.register_user()
        response = self.register_user(username='other', email='new@example.com')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_password_mismatch(self):
        response = self.client.post(
            self.register_url,
            {
                'username': 'user2',
                'email': 'user2@example.com',
                'password': VALID_PASSWORD,
                'password_confirm': 'Different1',
                'first_name': 'A',
                'last_name': 'B',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_weak_password(self):
        response = self.client.post(
            self.register_url,
            {
                'username': 'weak',
                'email': 'weak@example.com',
                'password': 'short',
                'password_confirm': 'short',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        self.register_user()
        response = self.login()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_with_email(self):
        self.register_user()
        response = self.login(username='new@example.com')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_invalid_credentials_generic_message(self):
        self.register_user()
        response = self.login(password='WrongPass1')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'], 'Unable to log in with provided credentials.')

        unknown_email = self.login(username='nobody@example.com')
        self.assertEqual(unknown_email.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(
            unknown_email.data['detail'],
            'Unable to log in with provided credentials.',
        )

    def test_user_endpoint_requires_auth(self):
        response = self.client.get(self.user_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user(self):
        self.register_user()
        tokens = self.login().data
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        response = self.client.get(self.user_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'newuser')

    def test_update_profile(self):
        self.register_user()
        tokens = self.login().data
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        response = self.client.patch(
            self.user_url,
            {'first_name': 'Updated', 'phone': '555-0100'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['phone'], '555-0100')

    def test_update_profile_rejects_duplicate_email(self):
        self.register_user()
        User.objects.create_user(
            username='other',
            email='taken@example.com',
            password=VALID_PASSWORD,
            role=User.Role.STAFF,
        )
        tokens = self.login().data
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        response = self.client.patch(
            self.user_url,
            {'email': 'taken@example.com'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_change_password_invalidates_existing_tokens(self):
        self.register_user()
        tokens = self.login().data
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        new_password = 'Xk9mNp2q'
        response = self.client.post(
            self.change_password_url,
            {
                'current_password': VALID_PASSWORD,
                'new_password': new_password,
                'new_password_confirm': new_password,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user_response = self.client.get(self.user_url)
        self.assertEqual(user_response.status_code, status.HTTP_401_UNAUTHORIZED)

        refresh_response = self.client.post(
            '/api/auth/refresh/',
            {'refresh': tokens['refresh']},
            format='json',
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.credentials()
        login_response = self.login(password=new_password)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

    def test_logout_blacklists_refresh_and_access_tokens(self):
        self.register_user()
        tokens = self.login().data
        access_token = tokens['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.post(
            self.logout_url,
            {'refresh': tokens['refresh']},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        refresh_response = self.client.post(
            '/api/auth/refresh/',
            {'refresh': tokens['refresh']},
            format='json',
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        user_response = self.client.get(self.user_url)
        self.assertEqual(user_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_refresh_token_for_other_user(self):
        self.register_user()
        tokens = self.login().data
        other = User.objects.create_user(
            username='other',
            email='other@example.com',
            password=VALID_PASSWORD,
            role=User.Role.STAFF,
        )
        other_tokens = self.client.post(
            self.login_url,
            {'username': 'other', 'password': VALID_PASSWORD},
            format='json',
        ).data

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        response = self.client.post(
            self.logout_url,
            {'refresh': other_tokens['refresh']},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
