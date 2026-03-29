# backend/payments/models.py

from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class Plan(models.Model):
    """
    Define los planes de entrenamiento (Mensual, Trimestral, etc.)
    """
    name = models.CharField(max_length=100, help_text="Ej: Mensualidad Regular")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Precio en USD")
    duration_days = models.IntegerField(default=30, help_text="Días de duración")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Plan de Entrenamiento'
        verbose_name_plural = 'Planes de Entrenamiento'

    def __str__(self):
        return f"{self.name} (${self.price})"

class Payment(models.Model):
    """
    Registro de pagos vinculados a un Plan.
    """
    class Currency(models.TextChoices):
        USD = 'USD', 'Dólares ($)'
        VED = 'VED', 'Bolívares (Bs)'

    class Method(models.TextChoices):
        CASH = 'CASH', 'Efectivo'
        PAGO_MOVIL = 'PAGO_MOVIL', 'Pago Móvil'
        ZELLE = 'ZELLE', 'Zelle'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    # MEJORA: El pago ahora se vincula a un plan específico
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=Currency.choices, default=Currency.USD)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    payment_date = models.DateField(default=timezone.now)
    end_date = models.DateField(help_text="Fecha de vencimiento.")
    
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.CASH)
    reference = models.CharField(max_length=50, blank=True, null=True)
    receipt_image = models.ImageField(upload_to='payments/receipts/', null=True, blank=True)

    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.user.internal_code} - {self.amount}{self.currency}"