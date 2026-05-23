from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import UserRole


class UserManagementTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='adminpass123')
        self.admin.profile.role = UserRole.ADMIN
        self.admin.profile.save()
        self.client.force_authenticate(user=self.admin)

    def test_list_users(self):
        response = self.client.get(reverse('user-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_get_current_user(self):
        response = self.client.get(reverse('current-user'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'admin')
