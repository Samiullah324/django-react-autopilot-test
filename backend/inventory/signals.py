from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification, NotificationType, Product


@receiver(post_save, sender=Product)
def check_product_stock_alerts(sender, instance, **kwargs):
    qty = instance.total_quantity
    if qty == 0:
        Notification.objects.get_or_create(
            product=instance,
            notification_type=NotificationType.OUT_OF_STOCK,
            is_read=False,
            defaults={
                'title': f'Out of stock: {instance.name}',
                'message': f'Product {instance.name} (SKU: {instance.sku}) is out of stock.',
            },
        )
    elif qty <= instance.low_stock_threshold:
        Notification.objects.get_or_create(
            product=instance,
            notification_type=NotificationType.LOW_STOCK,
            is_read=False,
            defaults={
                'title': f'Low stock: {instance.name}',
                'message': (
                    f'Product {instance.name} (SKU: {instance.sku}) has only '
                    f'{qty} units remaining (threshold: {instance.low_stock_threshold}).'
                ),
            },
        )
