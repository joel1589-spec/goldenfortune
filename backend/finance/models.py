from django.conf import settings
from django.db import models

class Transaction(models.Model):
    TYPE_CHOICES = [('depot','Dépôt'),('retrait','Retrait'),('tache','Tâche'),('roue','Roue'),('parrainage','Parrainage'),('bonus','Bonus')]
    STATUS_CHOICES = [('en attente','En attente'),('validé','Validé'),('payé','Payé'),('rejeté','Rejeté'),('complété','Complété')]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    amount = models.PositiveIntegerField()
    method = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='en attente')
    description = models.CharField(max_length=255, blank=True)
    tx_ref = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class Deposit(models.Model):
    STATUS_CHOICES = [('en attente','En attente'),('validé','Validé'),('rejeté','Rejeté')]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='deposits')
    amount = models.PositiveIntegerField()
    method = models.CharField(max_length=120)
    tx_ref = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='en attente')
    created_at = models.DateTimeField(auto_now_add=True)
    transaction = models.ForeignKey(Transaction, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ['-created_at']

class Withdrawal(models.Model):
    STATUS_CHOICES = [('en attente','En attente'),('payé','Payé'),('rejeté','Rejeté')]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawals')
    amount = models.PositiveIntegerField()
    method = models.CharField(max_length=120)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='en attente')
    created_at = models.DateTimeField(auto_now_add=True)
    transaction = models.ForeignKey(Transaction, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ['-created_at']
