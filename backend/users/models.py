# backend/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models, transaction # Importamos transaction
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

    #--- ULTIMA ASISTENCIA
    last_attendance_date = models.DateTimeField(null=True, blank=True, db_index=True)


    #-- contador de clase: 

    remaining_classes = models.IntegerField(default=0)
    membership_status = models.CharField(
    max_length=20, 
    choices=[('ACTIVE', 'Activo'), ('EXPIRED', 'Vencido'), ('DEBTOR', 'Moroso')],
    default='EXPIRED'
    )
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def has_available_classes(self):
        return self.remaining_classes > 0

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        # MEJORA: Unicidad compuesta para evitar duplicados de documentos entre tipos.
        unique_together = ('document_type', 'document_number')

    def save(self, *args, **kwargs):
        """
        Lógica con bloqueo de concurrencia para generación de códigos.
        """
        # 1. Normalización de nombre (tu lógica actual)
        full_name = f"{self.first_name} {self.last_name}"
        self.search_name = slugify(full_name).replace('-', ' ')
        
        # 2. Generación de código con Bloqueo de Fila (Select for Update)
        if self.role == self.Role.CLIENT and not self.internal_code:
            try:
                with transaction.atomic():
                    # Bloqueamos el registro del último cliente para que nadie más lo lea 
                    # hasta que nosotros terminemos de guardar este.
                    last_client = User.objects.select_for_update().filter(
                        role=self.Role.CLIENT, 
                        internal_code__startswith='C'
                    ).order_by('-id').first()

                    if last_client and last_client.internal_code:
                        try:
                            num = int(last_client.internal_code[1:]) + 1
                            self.internal_code = f"C{num:04d}"
                        except ValueError:
                            self.internal_code = "C0001"
                    else:
                        self.internal_code = "C0001"
                    
                    super().save(*args, **kwargs)
            except Exception:
                # Si algo falla en la transacción, dejamos que el error suba
                raise
        else:
            # Si no es cliente o ya tiene código, guardado normal
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.internal_code or 'S/C'} - {self.first_name} {self.last_name}"