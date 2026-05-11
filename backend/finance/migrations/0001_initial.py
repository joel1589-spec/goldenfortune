# Generated manually for Golden Fortune
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('depot', 'Dépôt'), ('retrait', 'Retrait'), ('tache', 'Tâche'), ('roue', 'Roue'), ('parrainage', 'Parrainage'), ('bonus', 'Bonus')], max_length=30)),
                ('amount', models.PositiveIntegerField()),
                ('method', models.CharField(blank=True, max_length=120)),
                ('status', models.CharField(choices=[('en attente', 'En attente'), ('validé', 'Validé'), ('payé', 'Payé'), ('rejeté', 'Rejeté'), ('complété', 'Complété')], default='en attente', max_length=30)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('tx_ref', models.CharField(blank=True, max_length=120)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Deposit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.PositiveIntegerField()),
                ('method', models.CharField(max_length=120)),
                ('tx_ref', models.CharField(blank=True, max_length=120)),
                ('status', models.CharField(choices=[('en attente', 'En attente'), ('validé', 'Validé'), ('rejeté', 'Rejeté')], default='en attente', max_length=30)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('transaction', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='finance.transaction')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deposits', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Withdrawal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.PositiveIntegerField()),
                ('method', models.CharField(max_length=120)),
                ('status', models.CharField(choices=[('en attente', 'En attente'), ('payé', 'Payé'), ('rejeté', 'Rejeté')], default='en attente', max_length=30)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('transaction', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='finance.transaction')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='withdrawals', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
