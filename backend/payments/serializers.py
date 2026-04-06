from rest_framework import serializers
from .models import Plan, Currency, ExchangeRate, Invoice, Payment

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['id', 'codPlan', 'name', 'price', 'duration_days', 'class_limit', 'is_active']

class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = '__all__'

class ExchangeRateSerializer(serializers.ModelSerializer):
    currency_code = serializers.CharField(source='currency.code', read_only=True)
    class Meta:
        model = ExchangeRate
        fields = ['id', 'currency', 'currency_code', 'rate', 'effective_date']

class PaymentSerializer(serializers.ModelSerializer):
    currency_code = serializers.CharField(source='currency.code', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'method', 'currency', 'currency_code', 
            'amount_paid', 'exchange_rate_payment', 'equivalent_usd', 
            'payment_date', 'reference', 'receipt_image'
        ]
        read_only_fields = ['equivalent_usd']

class InvoiceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True) # Anidamos los pagos para verlos desde la factura

    class Meta:
        model = Invoice
        fields = [
            'id', 'user', 'user_name', 'plan', 'plan_name', 'status', 
            'emission_date', 'exchange_rate_emission', 'amount_usd', 
            'amount_ves', 'payments'
        ]
        read_only_fields = ['status']