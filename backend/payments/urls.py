# backend/payments/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Nota: Importamos un ViewSet vacío por ahora para que Django no de error al arrancar.
from rest_framework import viewsets
from rest_framework.response import Response
from .views import PaymentViewSet


# Placeholder temporal para evitar errores hasta que programemos las vistas de pagos
class PaymentPlaceholderViewSet(viewsets.ViewSet):
    def list(self, request):
        return Response({"detail": "Módulo de pagos conectado correctamente."})

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]