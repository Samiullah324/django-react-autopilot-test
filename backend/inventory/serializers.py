from rest_framework import serializers

from .models import (
    Category,
    InventoryTransaction,
    Notification,
    Product,
    Supplier,
    Warehouse,
    WarehouseStock,
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'product_count', 'created_at')
        read_only_fields = ('created_at',)

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class SupplierSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = (
            'id', 'name', 'contact_person', 'email', 'phone', 'address',
            'is_active', 'product_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class SupplierDetailSerializer(SupplierSerializer):
    recent_transactions = serializers.SerializerMethodField()

    class Meta(SupplierSerializer.Meta):
        fields = SupplierSerializer.Meta.fields + ('recent_transactions',)

    def get_recent_transactions(self, obj):
        txns = InventoryTransaction.objects.filter(
            product__supplier=obj
        ).select_related('product', 'warehouse')[:10]
        return InventoryTransactionSerializer(txns, many=True).data


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ('id', 'name', 'location', 'is_active', 'created_at')
        read_only_fields = ('created_at',)


class WarehouseStockSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = WarehouseStock
        fields = ('id', 'warehouse', 'warehouse_name', 'quantity', 'updated_at')
        read_only_fields = ('updated_at',)


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, default='')
    total_quantity = serializers.IntegerField(read_only=True)
    stock_status = serializers.CharField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'sku', 'barcode', 'category', 'category_name',
            'supplier', 'supplier_name', 'price', 'low_stock_threshold',
            'total_quantity', 'stock_status', 'image_url', 'expiry_date',
            'is_active', 'created_at', 'updated_at',
        )

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductDetailSerializer(ProductListSerializer):
    stock_levels = WarehouseStockSerializer(many=True, read_only=True)
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ('description', 'stock_levels')


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            'name', 'sku', 'barcode', 'category', 'supplier', 'price',
            'low_stock_threshold', 'description', 'image', 'expiry_date', 'is_active',
        )

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Name is required.')
        return value

    def validate_sku(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('SKU is required.')
        qs = Product.objects.filter(sku__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A product with this SKU already exists.')
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Price cannot be negative.')
        return value

    def validate_low_stock_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError('Low stock threshold cannot be negative.')
        return value


class StockMovementSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    quantity = serializers.IntegerField()
    transaction_type = serializers.ChoiceField(
        choices=InventoryTransaction.TransactionType.choices,
    )
    unit_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True,
    )
    reference_number = serializers.CharField(required=False, allow_blank=True, max_length=64)
    notes = serializers.CharField(required=False, allow_blank=True)


class InventoryTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True,
    )

    class Meta:
        model = InventoryTransaction
        fields = (
            'id', 'transaction_type', 'transaction_type_display', 'product',
            'product_name', 'product_sku', 'warehouse', 'warehouse_name',
            'quantity', 'previous_quantity', 'new_quantity', 'unit_price',
            'reference_number', 'notes', 'created_by', 'created_by_name',
            'created_at',
        )
        read_only_fields = fields

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return ''


class NotificationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True, default='')

    class Meta:
        model = Notification
        fields = (
            'id', 'notification_type', 'title', 'message', 'product',
            'product_name', 'is_read', 'created_at',
        )


class DashboardStatsSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    low_stock_items = serializers.IntegerField()
    out_of_stock_items = serializers.IntegerField()
    total_suppliers = serializers.IntegerField()
    recent_transactions = serializers.IntegerField()


class ActivitySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True,
    )

    class Meta:
        model = InventoryTransaction
        fields = (
            'id', 'transaction_type', 'transaction_type_display',
            'product_name', 'warehouse_name', 'quantity',
            'created_by_name', 'created_at',
        )

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'System'
