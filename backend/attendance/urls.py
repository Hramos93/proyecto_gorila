# backend/attendance/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet # <-- Aquí está la importación correcta

# El DefaultRouter genera automáticamente las rutas estándar y nuestro @action
router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
]