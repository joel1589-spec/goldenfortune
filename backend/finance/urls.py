from django.urls import path
from . import views
urlpatterns = [
    path('transactions/', views.transactions),
    path('deposits/', views.create_deposit),
    path('withdrawals/', views.create_withdrawal),
    path('admin/deposits/', views.admin_deposits),
    path('admin/deposits/<int:deposit_id>/', views.admin_deposit_status),
    path('admin/withdrawals/', views.admin_withdrawals),
    path('admin/withdrawals/<int:withdrawal_id>/', views.admin_withdrawal_status),
]
