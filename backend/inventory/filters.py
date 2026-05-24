import django_filters
from django.db.models import Q

from .models import InventoryTransaction, Product, Supplier


class ProductFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    category = django_filters.NumberFilter(field_name='category_id')
    supplier = django_filters.NumberFilter(field_name='supplier_id')

    class Meta:
        model = Product
        fields = ['category', 'supplier', 'is_active']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value)
            | Q(sku__icontains=value)
            | Q(barcode__icontains=value)
        )


class TransactionFilter(django_filters.FilterSet):
    transaction_type = django_filters.CharFilter(field_name='transaction_type')
    product = django_filters.NumberFilter(field_name='product_id')
    warehouse = django_filters.NumberFilter(field_name='warehouse_id')
    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    date_to = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')

    class Meta:
        model = InventoryTransaction
        fields = ['transaction_type', 'product', 'warehouse']


class SupplierFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = Supplier
        fields = ['is_active']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value)
            | Q(email__icontains=value)
            | Q(contact_person__icontains=value)
        )
