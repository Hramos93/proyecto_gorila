# backend/customers/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet

router = DefaultRouter()
# SOLUCIÓN: Agregamos el prefijo 'customers' para que la URL final sea /api/v1/customers/
router.register(r'customers', CustomerViewSet, basename='customer')

urlpatterns = [
    path('', include(router.urls)),
]