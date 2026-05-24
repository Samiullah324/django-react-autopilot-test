from django.db import transaction

from .models import InventoryTransaction, Notification, Product, WarehouseStock


INCOMING_TYPES = {
    InventoryTransaction.TransactionType.PURCHASE,
    InventoryTransaction.TransactionType.RETURN,
    InventoryTransaction.TransactionType.STOCK_IN,
}

OUTGOING_TYPES = {
    InventoryTransaction.TransactionType.SALE,
    InventoryTransaction.TransactionType.STOCK_OUT,
}


def apply_stock_change(
    *,
    product,
    warehouse,
    quantity,
    transaction_type,
    user,
    unit_price=None,
    reference_number='',
    notes='',
):
    if quantity == 0:
        raise ValueError('Quantity must be non-zero.')

    if transaction_type in INCOMING_TYPES:
        delta = abs(quantity)
    elif transaction_type in OUTGOING_TYPES:
        delta = -abs(quantity)
    elif transaction_type == InventoryTransaction.TransactionType.ADJUSTMENT:
        delta = quantity
    else:
        raise ValueError(f'Unsupported transaction type: {transaction_type}')

    with transaction.atomic():
        stock, _ = WarehouseStock.objects.select_for_update().get_or_create(
            product=product,
            warehouse=warehouse,
            defaults={'quantity': 0},
        )
        previous = stock.quantity
        new_quantity = previous + delta
        if new_quantity < 0:
            raise ValueError('Insufficient stock for this operation.')

        stock.quantity = new_quantity
        stock.save(update_fields=['quantity', 'updated_at'])

        txn = InventoryTransaction.objects.create(
            transaction_type=transaction_type,
            product=product,
            warehouse=warehouse,
            quantity=delta,
            previous_quantity=previous,
            new_quantity=new_quantity,
            unit_price=unit_price,
            reference_number=reference_number,
            notes=notes,
            created_by=user,
        )

        _check_stock_alerts(product)
        return txn


def _check_stock_alerts(product):
    total = product.total_quantity
    Notification.objects.filter(
        product=product,
        notification_type__in=[
            Notification.NotificationType.LOW_STOCK,
            Notification.NotificationType.OUT_OF_STOCK,
        ],
        is_read=False,
    ).update(is_read=True)

    if total == 0:
        Notification.objects.create(
            notification_type=Notification.NotificationType.OUT_OF_STOCK,
            title=f'Out of stock: {product.name}',
            message=f'{product.name} ({product.sku}) is out of stock.',
            product=product,
        )
    elif total <= product.low_stock_threshold:
        Notification.objects.create(
            notification_type=Notification.NotificationType.LOW_STOCK,
            title=f'Low stock: {product.name}',
            message=(
                f'{product.name} ({product.sku}) has {total} units remaining '
                f'(threshold: {product.low_stock_threshold}).'
            ),
            product=product,
        )


def check_expiry_alerts():
    from django.utils import timezone

    today = timezone.now().date()
    expiring = Product.objects.filter(
        expiry_date__isnull=False,
        expiry_date__lte=today,
        is_active=True,
    )
    for product in expiring:
        exists = Notification.objects.filter(
            product=product,
            notification_type=Notification.NotificationType.EXPIRY,
            is_read=False,
        ).exists()
        if not exists:
            Notification.objects.create(
                notification_type=Notification.NotificationType.EXPIRY,
                title=f'Expiry alert: {product.name}',
                message=f'{product.name} ({product.sku}) expires on {product.expiry_date}.',
                product=product,
            )
