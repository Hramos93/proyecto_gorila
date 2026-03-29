# backend/payments/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import Payment
from .serializers import PaymentSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    """
    API para registrar y consultar pagos.
    """
    queryset = Payment.objects.all().select_related('user')
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]