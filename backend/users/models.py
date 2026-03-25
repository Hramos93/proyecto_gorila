from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.utils import timezone
from django.utils.text import slugify
from unidecode import unidecode

class User(AbstractUser):
    class Role(models.TextChoices):
        CLIENT = 'CLIENT', 'Cliente'
        COACH = 'COACH', 'Entrenador'
        WORKER = 'WORKER', 'Trabajador/Admin'

    class DocumentType(models.TextChoices):
        V = 'V', 'Venezolano'
        E = 'E', 'Extranjero'
        J = 'J', 'Jurídico'
        G = 'G', 'Gubernamental'
        T = 'T', 'Transeúnte'
        P = 'P', 'Pasaporte'

    class BloodType(models.TextChoices):
        A_POS = 'A+', 'A+'
        A_NEG = 'A-', 'A-'
        B_POS = 'B+', 'B+'
        B_NEG = 'B-', 'B-'
        O_POS = 'O+', 'O+'
        O_NEG = 'O-', 'O-'
        AB_POS = 'AB+', 'AB+'
        AB_NEG = 'AB-', 'AB-'

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CLIENT)
    internal_code = models.CharField(max_length=10, unique=True, null=True, blank=True, db_index=True)
    
    document_type = models.CharField(max_length=1, choices=DocumentType.choices, default=DocumentType.V)
    document_number = models.CharField(max_length=20, help_text="Número de Cédula, RIF o Pasaporte")
    
    phone_regex = RegexValidator(regex=r'^\+?1?\d{10,15}$', message="Formato válido: '+584141234567' o '04141234567'.")
    phone = models.CharField(validators=[phone_regex], max_length=17, blank=True, null=True)
    
    address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=150, blank=True, null=True)
    emergency_phone = models.CharField(validators=[phone_regex], max_length=17, blank=True, null=True)
    birth_date = models.DateField(null=True, blank=True)
    
    blood_type = models.CharField(max_length=3, choices=BloodType.choices, null=True, blank=True)
    has_injuries = models.BooleanField(default=False)
    injury_details = models.TextField(blank=True, null=True, help_text="Alergias, asma, lesiones previas, etc.")
    
    search_name = models.CharField(max_length=255, editable=False, db_index=True, help_text="Nombre normalizado para búsquedas OCR", default='')

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        unique_together = ('document_type', 'document_number')

    def save(self, *args, **kwargs):
        self.search_name = slugify(unidecode(f"{self.first_name} {self.last_name}"))
        super().save(*args, **kwargs)

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return self.get_full_name()
