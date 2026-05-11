from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def home(request):
    return JsonResponse({'message': 'Golden Fortune API running', 'api': '/api/', 'admin': '/admin-pro/'})

urlpatterns = [
    path('', home),
    path('admin-pro/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('finance.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('core.urls')),
    path('api/integrations/', include('integrations.urls')),
]
