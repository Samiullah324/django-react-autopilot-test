from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from inventory.models import (
    Category,
    InventoryTransaction,
    Product,
    Supplier,
    Warehouse,
    WarehouseStock,
)

User = get_user_model()


class InventoryAPITestCase(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            password='admin12345',
            role=User.Role.ADMIN,
        )
        self.staff = User.objects.create_user(
            username='staff',
            password='staff123',
            role=User.Role.STAFF,
        )
        self.warehouse = Warehouse.objects.create(name='Main', location='A1')
        self.category = Category.objects.create(name='Electronics')
        self.supplier = Supplier.objects.create(name='Acme Corp', email='acme@example.com')
        self.product = Product.objects.create(
            name='Test Widget',
            sku='TW-001',
            category=self.category,
            supplier=self.supplier,
            price=Decimal('19.99'),
            low_stock_threshold=5,
        )
        WarehouseStock.objects.get_or_create(product=self.product, warehouse=self.warehouse, defaults={"quantity": 0})

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_dashboard_requires_auth(self):
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_stats(self):
        self.authenticate(self.staff)
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stats', response.data)
        self.assertEqual(response.data['stats']['total_products'], 1)

    def test_create_product_as_manager(self):
        self.authenticate(self.admin)
        response = self.client.post('/api/products/', {
            'name': 'New Product',
            'sku': 'NP-001',
            'price': '9.99',
            'low_stock_threshold': 10,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_staff_cannot_create_product(self):
        self.authenticate(self.staff)
        response = self.client.post('/api/products/', {
            'name': 'Blocked',
            'sku': 'BL-001',
            'price': '1.00',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_stock_movement(self):
        self.authenticate(self.staff)
        response = self.client.post('/api/stock/move/', {
            'product_id': self.product.id,
            'warehouse_id': self.warehouse.id,
            'quantity': 20,
            'transaction_type': InventoryTransaction.TransactionType.STOCK_IN,
            'notes': 'Restock',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        stock = WarehouseStock.objects.get(product=self.product, warehouse=self.warehouse)
        self.assertEqual(stock.quantity, 20)

    def test_stock_out_insufficient(self):
        self.authenticate(self.staff)
        response = self.client.post('/api/stock/move/', {
            'product_id': self.product.id,
            'warehouse_id': self.warehouse.id,
            'quantity': 5,
            'transaction_type': InventoryTransaction.TransactionType.STOCK_OUT,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'admin12345',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_list_suppliers(self):
        self.authenticate(self.staff)
        response = self.client.get('/api/suppliers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
