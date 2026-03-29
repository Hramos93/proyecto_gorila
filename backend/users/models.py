# backend/users/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.text import slugify

class User(AbstractUser):
    """
    Modelo personalizado de Usuario para Energy Box CRM.
    Extiende la funcionalidad base de Django para soportar roles y datos de gimnasio.
    """

    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        STAFF = 'STAFF', 'Personal / Entrenador'
        CLIENT = 'CLIENT', 'Cliente'

    class DocumentType(models.TextChoices):
        V = 'V', 'Venezolano'
        E = 'E', 'Extranjero'
        J = 'J', 'Jurídico'
        P = 'P', 'Pasaporte'

    # --- CAMPOS DE IDENTIDAD ---
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CLIENT)
    document_type = models.CharField(max_length=1, choices=DocumentType.choices, default=DocumentType.V)
    document_number = models.CharField(max_length=20, unique=True, help_text="Cédula o RIF sin letras.")
    
    # MEJORA: Código interno necesario para el OCR de WhatsApp y sistema de asistencia.
    internal_code = models.CharField(max_length=10, unique=True, blank=True, null=True)

    # --- DATOS DE CONTACTO (Sincronizados con Ficha de Clientes) ---
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # MEJORA: Campo Avatar solicitado por el serializador para la interfaz de usuario.
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    # --- DATOS MÉDICOS Y EMERGENCIA (Extraídos del CSV de inscripción) ---
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    medical_conditions = models.TextField(
        blank=True, 
        null=True, 
        help_text="Lesiones, alergias o condiciones médicas reportadas en la ficha."
    )
    blood_type = models.CharField(max_length=5, blank=True, null=True)

    # --- BÚSQUEDA Y NORMALIZACIÓN ---
    search_name = models.CharField(max_length=255, db_index=True, blank=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        # MEJORA: Unicidad compuesta para evitar duplicados de documentos entre tipos.
        unique_together = ('document_type', 'document_number')

    def save(self, *args, **kwargs):
        """
        Lógica personalizada antes de guardar en la DB.
        """
        # Normalizamos el nombre de búsqueda para que el OCR sea más preciso.
        full_name = f"{self.first_name} {self.last_name}"
        self.search_name = slugify(full_name).replace('-', ' ')
        
        # Generación automática de internal_code si es cliente y no tiene uno.
        if self.role == self.Role.CLIENT and not self.internal_code:
            last_client = User.objects.filter(role=self.Role.CLIENT).order_by('-id').first()
            if last_client and last_client.internal_code and last_client.internal_code.startswith('C'):
                try:
                    num = int(last_client.internal_code[1:]) + 1
                    self.internal_code = f"C{num:04d}"
                except ValueError:
                    self.internal_code = "C0001"
            else:
                self.internal_code = "C0001"
                
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.internal_code or 'S/C'} - {self.first_name} {self.last_name}"