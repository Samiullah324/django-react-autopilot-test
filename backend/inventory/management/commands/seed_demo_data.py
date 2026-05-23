from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from accounts.models import UserRole
from inventory.models import (
    Category,
    InventoryTransaction,
    Product,
    StockLevel,
    Supplier,
    TransactionType,
    Warehouse,
)


class Command(BaseCommand):
    help = 'Seed demo data for the inventory management system'

    def handle(self, *args, **options):
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@inventory.local',
                'first_name': 'System',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            admin_user.set_password('admin12345')
            admin_user.save()
        admin_user.profile.role = UserRole.ADMIN
        admin_user.profile.save()

        manager, created = User.objects.get_or_create(
            username='manager',
            defaults={'email': 'manager@inventory.local', 'first_name': 'Inventory', 'last_name': 'Manager'},
        )
        if created:
            manager.set_password('manager123')
            manager.save()
        manager.profile.role = UserRole.MANAGER
        manager.profile.save()

        staff, created = User.objects.get_or_create(
            username='staff',
            defaults={'email': 'staff@inventory.local', 'first_name': 'Warehouse', 'last_name': 'Staff'},
        )
        if created:
            staff.set_password('staff123')
            staff.save()
        staff.profile.role = UserRole.STAFF
        staff.profile.save()

        categories = {}
        for name in ['Electronics', 'Office Supplies', 'Furniture', 'Hardware']:
            categories[name], _ = Category.objects.get_or_create(name=name)

        suppliers = {}
        for name, email in [
            ('TechSupply Co.', 'sales@techsupply.com'),
            ('Office Depot Pro', 'orders@officedepot.com'),
            ('Global Hardware', 'info@globalhardware.com'),
        ]:
            suppliers[name], _ = Supplier.objects.get_or_create(
                name=name,
                defaults={'email': email, 'contact_person': 'Sales Team', 'phone': '+1-555-0100'},
            )

        warehouses = {}
        for name, code in [('Main Warehouse', 'MAIN'), ('East Distribution', 'EAST'), ('West Storage', 'WEST')]:
            warehouses[code], _ = Warehouse.objects.get_or_create(
                code=code,
                defaults={'name': name, 'location': f'{name} Location'},
            )

        products_data = [
            ('Wireless Mouse', 'WM-001', 'Electronics', 'TechSupply Co.', 29.99, 15, 45),
            ('Mechanical Keyboard', 'KB-002', 'Electronics', 'TechSupply Co.', 89.99, 5, 20),
            ('USB-C Hub', 'HB-003', 'Electronics', 'TechSupply Co.', 49.99, 8, 0),
            ('A4 Paper Ream', 'PP-101', 'Office Supplies', 'Office Depot Pro', 5.99, 50, 200),
            ('Ballpoint Pens (Box)', 'PN-102', 'Office Supplies', 'Office Depot Pro', 12.99, 20, 8),
            ('Office Chair', 'CH-201', 'Furniture', 'Global Hardware', 249.99, 3, 12),
            ('Standing Desk', 'DK-202', 'Furniture', 'Global Hardware', 599.99, 2, 5),
            ('Screwdriver Set', 'TL-301', 'Hardware', 'Global Hardware', 34.99, 10, 3),
        ]

        for name, sku, cat, sup, price, threshold, qty in products_data:
            product, _ = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'category': categories[cat],
                    'supplier': suppliers[sup],
                    'price': price,
                    'low_stock_threshold': threshold,
                    'barcode': f'BAR{sku}',
                },
            )
            stock, _ = StockLevel.objects.get_or_create(
                product=product,
                warehouse=warehouses['MAIN'],
            )
            stock.quantity = qty
            stock.save()

            if qty > 0:
                InventoryTransaction.objects.get_or_create(
                    product=product,
                    warehouse=warehouses['MAIN'],
                    transaction_type=TransactionType.PURCHASE,
                    quantity=qty,
                    reference=f'INIT-{sku}',
                    defaults={'unit_price': price, 'performed_by': admin_user},
                )

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully.'))
        self.stdout.write('  admin / admin12345 (Admin)')
        self.stdout.write('  manager / manager123 (Manager)')
        self.stdout.write('  staff / staff123 (Staff)')
