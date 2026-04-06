# backend/attendance/models.py

from django.db import models
from django.utils import timezone
from django.conf import settings
from django.db.models import F

class TrainingClass(models.Model):
    """
    Catálogo de clases y horarios del gimnasio. Ej: 'Crossfit 6:00 AM'
    """
    name = models.CharField(max_length=100, help_text="Ej: Crossfit, Funcional, Yoga")
    schedule_time = models.TimeField(help_text="Horario de la clase")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Clase'
        verbose_name_plural = 'Clases'

    def __str__(self):
        return f"{self.name} - {self.schedule_time.strftime('%I:%M %p')}"


class Attendance(models.Model):
    """
    Registro histórico de entradas al gimnasio Energy Box.
    """
    class EntryMethod(models.TextChoices):
        MANUAL = 'MANUAL', 'Ingreso Manual (Sistema)'
        WHATSAPP = 'WHATSAPP', 'Captura de WhatsApp (OCR)'
        QR = 'QR', 'Código QR / Lector'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='attendances',
        help_text="Cliente que asiste."
    )
    
    # --- CAMPOS DE TRAZABILIDAD ---
    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        limit_choices_to={'role__in': ['ADMIN', 'STAFF']}, # Solo empleados
        related_name='classes_taught',
        help_text="Entrenador que impartió la clase"
    )
    training_class = models.ForeignKey(
        TrainingClass, 
        on_delete=models.SET_NULL, 
        null=True, blank=True
    )
    
    # --- LÓGICA DE MOROSIDAD ---
    is_debt = models.BooleanField(
        default=False, 
        help_text="True si el cliente asistió sin tener clases disponibles (Moroso)"
    )

    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    entry_method = models.CharField(max_length=15, choices=EntryMethod.choices, default=EntryMethod.MANUAL)
    ocr_raw_text = models.CharField(max_length=255, blank=True, null=True, help_text="Texto extraído del OCR.")

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Asistencia'
        verbose_name_plural = 'Asistencias'

    def save(self, *args, **kwargs):
        is_new = self.pk is None 
        
        # 1. Calculamos la deuda ANTES de hacer el save
        if is_new and self.user.remaining_classes <= 0:
            self.is_debt = True
            
        super().save(*args, **kwargs) # Guardamos el registro de asistencia
        
        # 2. Descuento atómico directo a la base de datos
        if is_new:
            self.user.__class__.objects.filter(pk=self.user.pk).update(
                remaining_classes=F('remaining_classes') - 1,
                last_attendance_date=self.timestamp
            )

    def __str__(self):
        date_str = self.timestamp.strftime("%Y-%m-%d %H:%M")
        return f"{self.user.internal_code} {self.user.first_name} - {date_str}"