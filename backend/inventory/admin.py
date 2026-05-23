from django.contrib import admin

from .models import (
    Category,
    InventoryTransaction,
    Notification,
    Product,
    StockLevel,
    Supplier,
    Warehouse,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ('name',)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'phone', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'email')


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'location', 'is_active')
    search_fields = ('name', 'code')


class StockLevelInline(admin.TabularInline):
    model = StockLevel
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'supplier', 'price', 'is_active')
    list_filter = ('category', 'supplier', 'is_active')
    search_fields = ('name', 'sku', 'barcode')
    inlines = (StockLevelInline,)


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ('product', 'warehouse', 'transaction_type', 'quantity', 'created_at')
    list_filter = ('transaction_type', 'warehouse')
    search_fields = ('product__name', 'product__sku', 'reference')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
