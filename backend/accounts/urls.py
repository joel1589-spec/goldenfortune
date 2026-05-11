from django.urls import path
from . import views
urlpatterns = [
    path('register/', views.register),
    path('login/', views.login),
    path('me/', views.me),
    path('activate/', views.activate),
    path('referrals/', views.referrals),
    path('password-reset/request/', views.password_reset_request),
    path('admin/users/', views.admin_users),
    path('admin/users/<int:user_id>/toggle/', views.admin_toggle_user),
    path('password-reset/direct/', views.password_reset_direct),
]
