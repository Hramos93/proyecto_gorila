# backend/users/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class User(AbstractUser):
    """
    Modelo de Usuario Personalizado para Energy Box CRM.
    Centraliza Clientes, Entrenadores y Trabajadores.
    """
    
    # 1. ROLES DEL SISTEMA
    ROLE_CHOICES = (
        ('CLIENT', 'Cliente'),
        ('COACH', 'Entrenador'),
        ('WORKER', 'Trabajador/Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='CLIENT')
    
    # 2. CÓDIGO INTERNO AUTOGENERADO (Ej: C0001, E0012)
    # Lo dejamos blank=True y null=True porque se genera en el save()
    internal_code = models.CharField(max_length=10, unique=True, blank=True, null=True, db_index=True)

    # 3. IDENTIDAD (Contexto Venezuela)
    DOC_TYPE_CHOICES = (
        ('V', 'Venezolano'),
        ('E', 'Extranjero'),
        ('J', 'Jurídico'),
        ('G', 'Gubernamental'),
        ('T', 'Transeúnte'),
        ('P', 'Pasaporte'),
    )
    document_type = models.CharField(max_length=1, choices=DOC_TYPE_CHOICES, default='V')
    document_number = models.CharField(max_length=20, help_text="Número de Cédula, RIF o Pasaporte")

    # 4. DATOS DE CONTACTO
    # Validador básico para teléfonos (acepta +58414... o 0414...)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{10,15}$', message="Formato válido: '+584141234567' o '04141234567'.")
    phone = models.CharField(validators=[phone_regex], max_length=17, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # 5. CONTACTO DE EMERGENCIA
    emergency_contact_name = models.CharField(max_length=150, blank=True, null=True)
    emergency_phone = models.CharField(validators=[phone_regex], max_length=17, blank=True, null=True)

    # 6. DATOS MÉDICOS Y FÍSICOS (Crucial para un Gimnasio)
    birth_date = models.DateField(blank=True, null=True)
    BLOOD_TYPE_CHOICES = (
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('O+', 'O+'), ('O-', 'O-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
    )
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES, blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True, help_text="Alergias, asma, lesiones previas, etc.")

    class Meta:
        # Evitar duplicidad real en BD (Ej: No pueden existir dos V-12345678)
        unique_together = ('document_type', 'document_number')
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"[{self.internal_code}] {self.get_full_name()} - {self.document_type}{self.document_number}"

    def save(self, *args, **kwargs):
        """
        Sobrescribimos el método save para generar el internal_code basado en el ID y el Rol.
        """
        # Primero guardamos para asegurar que la BD nos asigne un ID primario (PK)
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # Si no tiene código interno asignado, lo generamos
        if not self.internal_code:
            prefix = 'C'
            if self.role == 'COACH':
                prefix = 'E'
            elif self.role == 'WORKER':
                prefix = 'T'
            
            # Formateamos rellenando con ceros a la izquierda (Ej: C0001, C0015, C0104)
            self.internal_code = f"{prefix}{self.pk:04d}"
            
            # Guardamos de nuevo SOLO el campo internal_code para no disparar validaciones extra
            super().save(update_fields=['internal_code'])