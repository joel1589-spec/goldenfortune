from django.urls import path
from .views import fedapay_webhook
urlpatterns = [path('fedapay/webhook/', fedapay_webhook)]
