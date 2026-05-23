from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardView,
    StockMovementView,
    CategoryViewSet,
    NotificationViewSet,
    ProductViewSet,
    SupplierViewSet,
    TransactionViewSet,
    WarehouseStockViewSet,
    WarehouseViewSet,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('suppliers', SupplierViewSet, basename='supplier')
router.register('warehouses', WarehouseViewSet, basename='warehouse')
router.register('products', ProductViewSet, basename='product')
router.register('stock', WarehouseStockViewSet, basename='stock')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('stock/move/', StockMovementView.as_view(), name='stock-move'),
    path('', include(router.urls)),
]
