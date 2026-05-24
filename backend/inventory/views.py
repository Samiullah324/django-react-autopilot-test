from django.db.models import F, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsManagerOrAdmin, IsStaffOrAbove

from .filters import ProductFilter, SupplierFilter, TransactionFilter
from .models import (
    Category,
    InventoryTransaction,
    Notification,
    Product,
    Supplier,
    Warehouse,
    WarehouseStock,
)
from .reports import (
    category_distribution,
    dashboard_stats,
    export_products_csv,
    export_products_excel,
    export_transactions_excel,
    export_transactions_pdf,
    import_products_from_rows,
    parse_csv_upload,
    parse_excel_upload,
    recent_activity,
    transaction_trends,
)
from .serializers import (
    ActivitySerializer,
    CategorySerializer,
    DashboardStatsSerializer,
    InventoryTransactionSerializer,
    NotificationSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
    StockMovementSerializer,
    SupplierDetailSerializer,
    SupplierSerializer,
    WarehouseSerializer,
    WarehouseStockSerializer,
)
from .services import apply_stock_change, check_expiry_alerts


class DashboardView(APIView):
    permission_classes = [IsStaffOrAbove]

    def get(self, request):
        stats = dashboard_stats()
        activity = ActivitySerializer(recent_activity(), many=True).data
        return Response({
            'stats': DashboardStatsSerializer(stats).data,
            'category_distribution': category_distribution(),
            'transaction_trends': transaction_trends(),
            'recent_activity': activity,
        })


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrAbove]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsManagerOrAdmin()]
        return super().get_permissions()


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_class = SupplierFilter
    permission_classes = [IsStaffOrAbove]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SupplierDetailSerializer
        return SupplierSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsManagerOrAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        supplier = self.get_object()
        products = Product.objects.filter(supplier=supplier, is_active=True)
        data = ProductListSerializer(products, many=True, context={'request': request}).data
        return Response({'supplier': SupplierSerializer(supplier).data, 'products': data})


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsStaffOrAbove]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsManagerOrAdmin()]
        return super().get_permissions()


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'supplier').prefetch_related(
        'stock_levels__warehouse',
    )
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProductFilter
    permission_classes = [IsStaffOrAbove]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductWriteSerializer
        return ProductListSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsManagerOrAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        stock_status = self.request.query_params.get('stock_status')
        if not stock_status:
            return qs

        annotated = qs.annotate(total_qty=Sum('stock_levels__quantity'))
        if stock_status == 'out_of_stock':
            return annotated.filter(total_qty=0) | annotated.filter(total_qty__isnull=True)
        if stock_status == 'low_stock':
            return annotated.filter(total_qty__gt=0, total_qty__lte=F('low_stock_threshold'))
        if stock_status == 'in_stock':
            return annotated.filter(total_qty__gt=F('low_stock_threshold'))
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        if isinstance(response.data, dict) and 'results' in response.data:
            for item in response.data['results']:
                product = Product.objects.get(pk=item['id'])
                item['total_quantity'] = product.total_quantity
                item['stock_status'] = product.stock_status
        return response

    @action(detail=False, methods=['get'])
    def export(self, request):
        fmt = request.query_params.get('format', 'csv')
        products = self.filter_queryset(self.get_queryset())
        if fmt == 'xlsx':
            return export_products_excel(products)
        return export_products_csv(products)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_file(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        name = file.name.lower()
        if name.endswith('.csv'):
            rows = parse_csv_upload(file)
        elif name.endswith(('.xlsx', '.xls')):
            rows = parse_excel_upload(file)
        else:
            return Response(
                {'detail': 'Unsupported format. Use CSV or Excel.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = import_products_from_rows(rows, request.user)
        return Response(result)


class WarehouseStockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WarehouseStock.objects.select_related('product', 'warehouse')
    serializer_class = WarehouseStockSerializer
    permission_classes = [IsStaffOrAbove]
    filterset_fields = ['warehouse', 'product']


class StockMovementView(APIView):
    permission_classes = [IsStaffOrAbove]

    def post(self, request):
        serializer = StockMovementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            product = Product.objects.get(pk=data['product_id'])
            warehouse = Warehouse.objects.get(pk=data['warehouse_id'])
            txn = apply_stock_change(
                product=product,
                warehouse=warehouse,
                quantity=data['quantity'],
                transaction_type=data['transaction_type'],
                user=request.user,
                unit_price=data.get('unit_price'),
                reference_number=data.get('reference_number', ''),
                notes=data.get('notes', ''),
            )
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Warehouse.DoesNotExist:
            return Response({'detail': 'Warehouse not found.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            InventoryTransactionSerializer(txn).data,
            status=status.HTTP_201_CREATED,
        )


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryTransaction.objects.select_related(
        'product', 'warehouse', 'created_by',
    )
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsStaffOrAbove]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransactionFilter

    @action(detail=False, methods=['get'])
    def export(self, request):
        fmt = request.query_params.get('format', 'xlsx')
        txns = self.filter_queryset(self.get_queryset())
        if fmt == 'pdf':
            return export_transactions_pdf(txns)
        return export_transactions_excel(txns)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsStaffOrAbove]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = Notification.objects.select_related('product')
        if not self.request.user.is_manager:
            return qs.filter(user=self.request.user) | qs.filter(user__isnull=True)
        return qs

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})

    @action(detail=False, methods=['post'])
    def check_expiry(self, request):
        if not request.user.is_manager:
            return Response(status=status.HTTP_403_FORBIDDEN)
        check_expiry_alerts()
        return Response({'detail': 'Expiry alerts checked.'})
