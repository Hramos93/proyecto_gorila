from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.db.models import Sum

class Plan(models.Model):
    codPlan = models.CharField(max_length=20, unique=True, help_text="Ej: MENS-12")
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField(default=30)
    class_limit = models.IntegerField(default=1, help_text="Total de clases incluidas")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"[{self.codPlan}] {self.name}"


class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True, help_text="Ej: USD, VES")
    symbol = models.CharField(max_length=5, help_text="Ej: $, Bs.")
    is_base = models.BooleanField(default=False, help_text="True solo para USD")

    def __str__(self):
        return f"{self.code} ({self.symbol})"


class ExchangeRate(models.Model):
    currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='rates')
    rate = models.DecimalField(max_digits=15, decimal_places=4)
    effective_date = models.DateField(default=timezone.now)
    # --- LA LÍNEA QUE FALTABA ---
    created_at = models.DateTimeField(auto_now_add=True) 

    class Meta:
        unique_together = ('currency', 'effective_date')
        # También le devolvemos su ordenamiento para que la tasa más reciente salga primero
        ordering = ['-effective_date', '-created_at']

    def __str__(self):
        return f"{self.currency.code} - {self.rate} ({self.effective_date})"


class Invoice(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        PARTIAL = 'PARTIAL', 'Abono Parcial'
        PAID = 'PAID', 'Pagado'
        CANCELLED = 'CANCELLED', 'Anulada'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='invoices')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    
    emission_date = models.DateTimeField(default=timezone.now)
    exchange_rate_emission = models.DecimalField(max_digits=15, decimal_places=4, help_text="Tasa al momento de crear factura")
    
    amount_usd = models.DecimalField(max_digits=10, decimal_places=2)
    amount_ves = models.DecimalField(max_digits=15, decimal_places=2)

    # --- NUEVO: Le devolvemos su fecha de vencimiento ---
    end_date = models.DateField(null=True, blank=True, help_text="Calculado automáticamente según el plan")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_status = self.status

    def save(self, *args, **kwargs):
        # Auto-calcular el vencimiento
        if self.plan and not self.end_date:
            self.end_date = timezone.now().date() + timedelta(days=self.plan.duration_days)

        with transaction.atomic():
            super().save(*args, **kwargs)
            
            # TRIGGER: Si se paga, le damos sus clases al usuario
            if self.status == self.Status.PAID and self._original_status != self.Status.PAID:
                user = self.user
                user.remaining_classes += self.plan.class_limit
                user.save(update_fields=['remaining_classes']) # Corregido: ya no busca el campo inexistente
                self._original_status = self.status 

    def __str__(self):
        return f"INV-{self.id} | {self.user.first_name} | {self.status}"


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = 'CASH', 'Efectivo'
        PAGO_MOVIL = 'PAGO_MOVIL', 'Pago Móvil'
        ZELLE = 'ZELLE', 'Zelle'
        POS = 'POS', 'Punto de Venta'
        TRANSFER = 'TRANSFER', 'Transferencia'
        CHANGE = 'CHANGE', 'Vuelto / Cambio'

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    method = models.CharField(max_length=20, choices=Method.choices, default=Method.CASH)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    
    amount_paid = models.DecimalField(max_digits=15, decimal_places=2, help_text="Monto transferido o entregado")
    exchange_rate_payment = models.DecimalField(max_digits=15, decimal_places=4, help_text="Tasa BCV del momento del pago")
    equivalent_usd = models.DecimalField(max_digits=10, decimal_places=2)
    
    payment_date = models.DateTimeField(default=timezone.now)
    reference = models.CharField(max_length=50, blank=True, null=True)
    receipt_image = models.ImageField(upload_to='payments/receipts/', null=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        
        # Auto-calcular el equivalente en USD antes de guardar
        if self.exchange_rate_payment and self.exchange_rate_payment > 0:
            self.equivalent_usd = round(self.amount_paid / self.exchange_rate_payment, 2)
        
        with transaction.atomic():
            super().save(*args, **kwargs)
            
            # TRIGGER CONTABLE: Sumarizar pagos y actualizar estatus de la factura
            if is_new:
                invoice = self.invoice
                total_paid = invoice.payments.aggregate(Sum('equivalent_usd'))['equivalent_usd__sum'] or 0
                
                if total_paid >= invoice.amount_usd and invoice.status != Invoice.Status.PAID:
                    invoice.status = Invoice.Status.PAID
                    invoice.save()
                elif total_paid > 0 and invoice.status == Invoice.Status.PENDING:
                    invoice.status = Invoice.Status.PARTIAL
                    invoice.save()

    def __str__(self):
        return f"{self.amount_paid} {self.currency.code} -> INV-{self.invoice.id}"