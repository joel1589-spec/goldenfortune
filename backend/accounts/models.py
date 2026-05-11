from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=40, blank=True)
    country = models.CharField(max_length=80, default='Togo')
    sponsor = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='direct_referrals')
    sponsor_code = models.CharField(max_length=150, blank=True)
    is_active_member = models.BooleanField(default=False)
    activated_at = models.DateTimeField(null=True, blank=True)
    balance = models.PositiveIntegerField(default=0)
    total_profit = models.PositiveIntegerField(default=0)
    total_withdrawn = models.PositiveIntegerField(default=0)
    welcome_bonus = models.PositiveIntegerField(default=0)
    referrals = models.PositiveIntegerField(default=0)
    task_done_today = models.BooleanField(default=False)
    task_last_date = models.DateField(null=True, blank=True)
    wheel_used = models.BooleanField(default=False)
    wheel_last_used = models.DateTimeField(null=True, blank=True)
    task_wheel_last_used = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username or self.email
