from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Product, Warehouse, WarehouseStock


@receiver(post_save, sender=Product)
def create_default_stock(sender, instance, created, **kwargs):
    if not created:
        return
    default_warehouse = Warehouse.objects.filter(is_active=True).order_by('id').first()
    if default_warehouse:
        WarehouseStock.objects.get_or_create(
            product=instance,
            warehouse=default_warehouse,
            defaults={'quantity': 0},
        )
