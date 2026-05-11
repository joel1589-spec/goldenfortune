from django.contrib import admin
from .models import Transaction, Deposit, Withdrawal
admin.site.register(Transaction)
admin.site.register(Deposit)
admin.site.register(Withdrawal)
