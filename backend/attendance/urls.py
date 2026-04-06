# backend/attendance/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet,TrainingClassViewSet # <-- Aquí está la importación correcta


# El DefaultRouter genera automáticamente las rutas estándar y nuestro @action
router = DefaultRouter()
router.register(r'attendances', AttendanceViewSet, basename='attendance')
# Registramos la ruta para las clases:
router.register(r'classes', TrainingClassViewSet, basename='training-class')

urlpatterns = [
    path('', include(router.urls)),
] 