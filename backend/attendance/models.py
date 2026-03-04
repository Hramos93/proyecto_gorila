# backend/attendance/models.py

from django.db import models
from django.conf import settings

class Attendance(models.Model):
    """
    Registro histórico de entradas al gimnasio Energy Box.
    """

    class EntryMethod(models.TextChoices):
        MANUAL = 'MANUAL', 'Ingreso Manual (Sistema)'
        WHATSAPP = 'WHATSAPP', 'Captura de WhatsApp (OCR)'
        QR = 'QR', 'Código QR / Lector'

    # Relación con el Custom User. Usamos settings.AUTH_USER_MODEL por buenas prácticas.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='attendances',
        help_text="Cliente o Entrenador que asiste."
    )
    
    # Hora exacta en la que se registra la asistencia. 
    # auto_now_add=True toma la hora del servidor en ese milisegundo.
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Cómo se registró la asistencia
    entry_method = models.CharField(
        max_length=15,
        choices=EntryMethod.choices,
        default=EntryMethod.MANUAL
    )
    
    # Campo de auditoría: Si el OCR leyó algo extraño o dudoso, se guarda aquí.
    ocr_raw_text = models.CharField(max_length=255, blank=True, null=True, help_text="Texto original extraído de la imagen si se usó OCR.")

    class Meta:
        # Por defecto, cuando consultemos asistencias, traerá las más recientes primero
        ordering = ['-timestamp']
        verbose_name = 'Asistencia'
        verbose_name_plural = 'Asistencias'

    def __str__(self):
        # Formato de lectura rápida: "C0001 Juan Perez - 2023-10-25 14:30"
        date_str = self.timestamp.strftime("%Y-%m-%d %H:%M")
        return f"{self.user.internal_code} {self.user.first_name} - {date_str}"