from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from inventory.models import Category, Product, Supplier, Warehouse, WarehouseStock
from inventory.services import apply_stock_change
from inventory.models import InventoryTransaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed demo data for the inventory management system'

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            admin.set_password('admin12345')
            admin.save()
            self.stdout.write('Created admin user (admin / admin12345)')

        manager, _ = User.objects.get_or_create(
            username='manager',
            defaults={'email': 'manager@example.com', 'role': User.Role.MANAGER, 'is_staff': True},
        )
        if _:
            manager.set_password('manager123')
            manager.save()

        staff, _ = User.objects.get_or_create(
            username='staff',
            defaults={'email': 'staff@example.com', 'role': User.Role.STAFF},
        )
        if _:
            staff.set_password('staff123')
            staff.save()

        warehouse, _ = Warehouse.objects.get_or_create(
            name='Main Warehouse',
            defaults={'location': 'Building A, Floor 1'},
        )
        Warehouse.objects.get_or_create(
            name='Secondary Storage',
            defaults={'location': 'Building B'},
        )

        electronics, _ = Category.objects.get_or_create(
            name='Electronics',
            defaults={'description': 'Electronic devices and accessories'},
        )
        Category.objects.get_or_create(name='Office Supplies')
        Category.objects.get_or_create(name='Furniture')

        supplier, _ = Supplier.objects.get_or_create(
            name='TechSupply Co.',
            defaults={
                'contact_person': 'Jane Doe',
                'email': 'jane@techsupply.example.com',
                'phone': '+1-555-0100',
                'address': '123 Industrial Blvd',
            },
        )
        Supplier.objects.get_or_create(
            name='OfficeMart',
            defaults={'contact_person': 'John Smith', 'email': 'john@officemart.example.com'},
        )

        products_data = [
            ('Wireless Mouse', 'WM-001', electronics, supplier, 29.99, 15),
            ('USB-C Hub', 'UCH-002', electronics, supplier, 49.99, 10),
            ('Mechanical Keyboard', 'MK-003', electronics, supplier, 129.99, 5),
            ('Notebook A5', 'NB-004', None, None, 4.99, 50),
            ('Office Chair', 'OC-005', None, None, 299.99, 3),
        ]

        for name, sku, category, sup, price, threshold in products_data:
            product, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'category': category,
                    'supplier': sup,
                    'price': price,
                    'low_stock_threshold': threshold,
                    'barcode': f'BAR{sku}',
                },
            )
            if created:
                stock, _ = WarehouseStock.objects.get_or_create(
                    product=product,
                    warehouse=warehouse,
                    defaults={'quantity': 0},
                )
                if stock.quantity == 0:
                    apply_stock_change(
                        product=product,
                        warehouse=warehouse,
                        quantity=threshold * 2,
                        transaction_type=InventoryTransaction.TransactionType.PURCHASE,
                        user=admin,
                        notes='Initial seed stock',
                    )

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully.'))
