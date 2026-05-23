from django.db import transaction
from django.db.models import F, Sum
from rest_framework import serializers

from .models import (
    Category,
    InventoryTransaction,
    Notification,
    Product,
    StockLevel,
    Supplier,
    TransactionType,
    Warehouse,
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'product_count', 'created_at')
        read_only_fields = ('created_at',)

    def get_product_count(self, obj):
        return obj.products.count()


class SupplierSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    total_inventory_value = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = (
            'id', 'name', 'contact_person', 'email', 'phone', 'address',
            'is_active', 'product_count', 'total_inventory_value',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

    def get_total_inventory_value(self, obj):
        total = 0
        for product in obj.products.filter(is_active=True):
            total += float(product.price) * product.total_quantity
        return round(total, 2)


class WarehouseSerializer(serializers.ModelSerializer):
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Warehouse
        fields = ('id', 'name', 'code', 'location', 'is_active', 'total_items', 'created_at')
        read_only_fields = ('created_at',)

    def get_total_items(self, obj):
        return obj.stock_levels.aggregate(total=Sum('quantity'))['total'] or 0


class StockLevelSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.code', read_only=True)

    class Meta:
        model = StockLevel
        fields = ('id', 'warehouse', 'warehouse_name', 'warehouse_code', 'quantity', 'updated_at')
        read_only_fields = ('updated_at',)


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    total_quantity = serializers.IntegerField(read_only=True)
    stock_status = serializers.CharField(read_only=True)
    stock_levels = StockLevelSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'sku', 'barcode', 'category', 'category_name',
            'supplier', 'supplier_name', 'price', 'low_stock_threshold',
            'description', 'image', 'expiry_date', 'is_active',
            'total_quantity', 'stock_status', 'stock_levels',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')


class InventoryTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    performed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InventoryTransaction
        fields = (
            'id', 'product', 'product_name', 'product_sku', 'warehouse', 'warehouse_name',
            'transaction_type', 'quantity', 'unit_price', 'reference', 'notes',
            'performed_by', 'performed_by_name', 'created_at',
        )
        read_only_fields = ('performed_by', 'created_at')

    def get_performed_by_name(self, obj):
        if obj.performed_by:
            return obj.performed_by.get_full_name() or obj.performed_by.username
        return None


class StockMovementSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))
    warehouse = serializers.PrimaryKeyRelatedField(queryset=Warehouse.objects.filter(is_active=True))
    quantity = serializers.IntegerField(min_value=1)
    transaction_type = serializers.ChoiceField(choices=TransactionType.choices)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    reference = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    INCOMING_TYPES = {
        TransactionType.PURCHASE,
        TransactionType.RETURN,
        TransactionType.STOCK_IN,
    }
    OUTGOING_TYPES = {
        TransactionType.SALE,
        TransactionType.STOCK_OUT,
    }

    @transaction.atomic
    def create(self, validated_data):
        product = validated_data['product']
        warehouse = validated_data['warehouse']
        quantity = validated_data['quantity']
        transaction_type = validated_data['transaction_type']
        user = self.context['request'].user

        stock_level, _ = StockLevel.objects.select_for_update().get_or_create(
            product=product,
            warehouse=warehouse,
            defaults={'quantity': 0},
        )

        if transaction_type in self.INCOMING_TYPES:
            StockLevel.objects.filter(pk=stock_level.pk).update(quantity=F('quantity') + quantity)
        elif transaction_type in self.OUTGOING_TYPES:
            stock_level.refresh_from_db()
            if stock_level.quantity < quantity:
                raise serializers.ValidationError(
                    {'quantity': f'Insufficient stock. Available: {stock_level.quantity}'}
                )
            StockLevel.objects.filter(pk=stock_level.pk).update(quantity=F('quantity') - quantity)
        elif transaction_type == TransactionType.ADJUSTMENT:
            StockLevel.objects.filter(pk=stock_level.pk).update(quantity=quantity)
        else:
            raise serializers.ValidationError({'transaction_type': 'Invalid transaction type.'})

        return InventoryTransaction.objects.create(
            product=product,
            warehouse=warehouse,
            transaction_type=transaction_type,
            quantity=quantity,
            unit_price=validated_data.get('unit_price'),
            reference=validated_data.get('reference', ''),
            notes=validated_data.get('notes', ''),
            performed_by=user,
        )


class NotificationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Notification
        fields = (
            'id', 'notification_type', 'title', 'message', 'product',
            'product_name', 'is_read', 'created_at',
        )
        read_only_fields = ('created_at',)
