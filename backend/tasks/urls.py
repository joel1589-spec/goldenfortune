from django.urls import path
from . import views
urlpatterns = [
    path('tasks/', views.list_tasks),
    path('tasks/complete/', views.complete_task),
    path('wheel/spin/', views.spin_wheel),
    path('admin/tasks/', views.admin_tasks),
    path('admin/tasks/<int:task_id>/', views.admin_task_delete),
]
