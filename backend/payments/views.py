from rest_framework import viewsets
from rest_framework.permissions import SAFE_METHODS
from .models import Plan, Currency, ExchangeRate, Invoice, Payment
from .serializers import (
    PlanSerializer, CurrencySerializer, ExchangeRateSerializer, 
    InvoiceSerializer, PaymentSerializer
)
from customers.permissions import IsStaffOrAdmin

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all().order_by('price')
    serializer_class = PlanSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_permissions(self):
        if self.request.method not in SAFE_METHODS:
            from customers.permissions import IsEnergyBoxAdmin
            return [IsEnergyBoxAdmin()]
        return super().get_permissions()

class CurrencyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [IsStaffOrAdmin]

class ExchangeRateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExchangeRate.objects.all().order_by('-effective_date')
    serializer_class = ExchangeRateSerializer
    permission_classes = [IsStaffOrAdmin]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related('user', 'plan').prefetch_related('payments').order_by('-emission_date')
    serializer_class = InvoiceSerializer
    permission_classes = [IsStaffOrAdmin]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().select_related('invoice', 'currency').order_by('-payment_date')
    serializer_class = PaymentSerializer
    permission_classes = [IsStaffOrAdmin]