from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class Plan(models.Model):
    """Define un tipo de membresía, como 'Mensual', 'Trimestral', etc."""
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre del Plan")
    duration_days = models.IntegerField(verbose_name="Duración en días")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio")
    is_active = models.BooleanField(default=True, verbose_name="¿Está activo?")

    class Meta:
        verbose_name = "Plan de Membresía"
        verbose_name_plural = "Planes de Membresía"
        ordering = ['duration_days']

    def __str__(self):
        return self.name

class Payment(models.Model):
    """Registra un pago realizado por un usuario para un plan específico."""
    
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Efectivo'
        TRANSFER = 'TRANSFER', 'Transferencia'
        CARD = 'CARD', 'Tarjeta'
        MOBILE = 'MOBILE_PAY', 'Pago Móvil'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name="Usuario"
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.SET_NULL,
        null=True,
        related_name='payments',
        verbose_name="Plan"
    )
    payment_date = models.DateTimeField(default=timezone.now, verbose_name="Fecha de Pago")
    start_date = models.DateField(verbose_name="Fecha de Inicio de Cobertura")
    end_date = models.DateField(verbose_name="Fecha de Fin de Cobertura")
    
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Monto Pagado")
    payment_method = models.CharField(
        max_length=12,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
        verbose_name="Método de Pago"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Notas Adicionales")

    class Meta:
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"
        ordering = ['-payment_date']

    def save(self, *args, **kwargs):
        # Si la fecha de inicio no está definida, usar la fecha del pago
        if not self.start_date:
            self.start_date = self.payment_date.date()
        
        # Calcular la fecha de fin automáticamente si se tiene un plan
        if self.plan and not self.end_date:
            self.end_date = self.start_date + timedelta(days=self.plan.duration_days)
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pago de {self.user} - {self.plan.name if self.plan else 'Plan Eliminado'}"
