from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
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

    def test_list_products(self):
        self.authenticate(self.staff)
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Widget')
        self.assertIn('description', response.data['results'][0])

    def test_retrieve_product(self):
        self.authenticate(self.staff)
        response = self.client.get(f'/api/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sku'], 'TW-001')
        self.assertIn('stock_levels', response.data)

    def test_retrieve_product_not_found(self):
        self.authenticate(self.staff)
        response = self.client.get('/api/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_product(self):
        self.authenticate(self.admin)
        response = self.client.patch(f'/api/products/{self.product.id}/', {
            'name': 'Updated Widget',
            'price': '24.99',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Updated Widget')
        self.assertEqual(self.product.price, Decimal('24.99'))

    def test_delete_product(self):
        self.authenticate(self.admin)
        product_id = self.product.id
        response = self.client.delete(f'/api/products/{product_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(pk=product_id).exists())

    def test_delete_product_not_found(self):
        self.authenticate(self.admin)
        response = self.client.delete('/api/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_product_invalid_price(self):
        self.authenticate(self.admin)
        response = self.client.post('/api/products/', {
            'name': 'Bad Price',
            'sku': 'BP-001',
            'price': '0',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('price', response.data)

    def test_create_product_missing_name(self):
        self.authenticate(self.admin)
        response = self.client.post('/api/products/', {
            'name': '   ',
            'sku': 'MN-001',
            'price': '9.99',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_product_missing_sku(self):
        self.authenticate(self.admin)
        response = self.client.post('/api/products/', {
            'name': 'No SKU',
            'sku': '',
            'price': '9.99',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sku', response.data)

    def test_product_model_validation(self):
        product = Product(
            name='',
            sku='',
            price=Decimal('0'),
        )
        with self.assertRaises(ValidationError):
            product.full_clean()
