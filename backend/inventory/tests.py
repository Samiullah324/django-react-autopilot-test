from decimal import Decimal

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import UserRole
from inventory.models import Category, Product, Supplier, Warehouse


class AuthAPITestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='testadmin', password='testpass123', email='admin@test.com',
        )
        self.admin.profile.role = UserRole.ADMIN
        self.admin.profile.save()

        self.staff = User.objects.create_user(
            username='teststaff', password='testpass123', email='staff@test.com',
        )
        self.staff.profile.role = UserRole.STAFF
        self.staff.profile.save()

    def authenticate(self, user):
        self.client.force_authenticate(user=user)


class LoginTests(AuthAPITestCase):
    def test_login_returns_tokens_and_user(self):
        response = self.client.post(reverse('login'), {
            'username': 'testadmin',
            'password': 'testpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testadmin')


class ProductAPITests(AuthAPITestCase):
    def setUp(self):
        super().setUp()
        self.authenticate(self.admin)
        self.category = Category.objects.create(name='Test Category')
        self.supplier = Supplier.objects.create(name='Test Supplier')
        self.warehouse = Warehouse.objects.create(name='Main', code='MAIN')

    def test_create_product(self):
        response = self.client.post(reverse('product-list'), {
            'name': 'Test Product',
            'sku': 'TEST-001',
            'category': self.category.id,
            'supplier': self.supplier.id,
            'price': '19.99',
            'low_stock_threshold': 5,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)

    def test_stock_movement_increases_quantity(self):
        product = Product.objects.create(
            name='Widget', sku='W-001', category=self.category,
            supplier=self.supplier, price=Decimal('10.00'),
        )
        response = self.client.post(reverse('stock-move'), {
            'product': product.id,
            'warehouse': self.warehouse.id,
            'quantity': 25,
            'transaction_type': 'stock_in',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        product.refresh_from_db()
        self.assertEqual(product.total_quantity, 25)

    def test_stock_out_fails_with_insufficient_stock(self):
        product = Product.objects.create(
            name='Widget', sku='W-002', category=self.category,
            supplier=self.supplier, price=Decimal('10.00'),
        )
        response = self.client.post(reverse('stock-move'), {
            'product': product.id,
            'warehouse': self.warehouse.id,
            'quantity': 10,
            'transaction_type': 'stock_out',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DashboardAPITests(AuthAPITestCase):
    def test_dashboard_requires_auth(self):
        response = self.client.get(reverse('dashboard'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_returns_stats(self):
        self.authenticate(self.staff)
        response = self.client.get(reverse('dashboard'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_products', response.data)
        self.assertIn('recent_transactions', response.data)


class PermissionTests(AuthAPITestCase):
    def test_staff_cannot_create_supplier(self):
        self.authenticate(self.staff)
        response = self.client.post(reverse('supplier-list'), {'name': 'New Supplier'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_list_products(self):
        self.authenticate(self.staff)
        response = self.client.get(reverse('product-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
