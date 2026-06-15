# Generated to ensure token_blacklist migrations are applied before auth features.

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
        ('token_blacklist', '0012_alter_outstandingtoken_user'),
    ]

    operations = []
