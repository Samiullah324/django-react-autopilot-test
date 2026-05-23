from django.contrib import admin

from .models import (
    Category,
    InventoryTransaction,
    Notification,
    Product,
    Supplier,
    Warehouse,
    WarehouseStock,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ('name',)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'phone', 'is_active')
    search_fields = ('name', 'email')
    list_filter = ('is_active',)


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'is_active')
    list_filter = ('is_active',)


class WarehouseStockInline(admin.TabularInline):
    model = WarehouseStock
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'price', 'low_stock_threshold', 'is_active')
    search_fields = ('name', 'sku', 'barcode')
    list_filter = ('category', 'is_active', 'supplier')
    inlines = [WarehouseStockInline]


@admin.register(WarehouseStock)
class WarehouseStockAdmin(admin.ModelAdmin):
    list_display = ('product', 'warehouse', 'quantity', 'updated_at')
    list_filter = ('warehouse',)


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'transaction_type',
        'product',
        'warehouse',
        'quantity',
        'created_by',
        'created_at',
    )
    list_filter = ('transaction_type', 'warehouse', 'created_at')
    search_fields = ('product__sku', 'reference_number')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notification_type', 'user', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
