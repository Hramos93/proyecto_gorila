# backend/users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Configuración avanzada del panel administrativo para Energy Box CRM.
    Organiza los datos por secciones: Identidad, Contacto y Salud.
    """
    
    # MEJORA: Columnas visibles en la tabla principal de usuarios.
    list_display = ('internal_code', 'username', 'first_name', 'last_name', 'role', 'document_number', 'is_active')
    
    # MEJORA: Filtros laterales para segmentar clientes de entrenadores o administradores.
    list_filter = ('role', 'is_active', 'document_type')
    
    # MEJORA: Búsqueda potente por nombre, cédula o código del gimnasio.
    search_fields = ('internal_code', 'username', 'first_name', 'last_name', 'document_number', 'search_name')
    
    # Orden predeterminado por código interno (C0001, C0002...)
    ordering = ('internal_code',)

    # --- ORGANIZACIÓN DE CAMPOS EN EL FORMULARIO DE EDICIÓN ---
    fieldsets = (
        ('Credenciales de Acceso', {
            'fields': ('username', 'password', 'role', 'is_active')
        }),
        ('Identidad Personal', {
            'fields': (
                'avatar', 
                'first_name', 
                'last_name', 
                'document_type', 
                'document_number', 
                'internal_code'
            )
        }),
        ('Información de Contacto', {
            'fields': ('phone_number', 'email', 'address')
        }),
        ('Ficha Médica y Emergencia (Energy Box)', {
            # MEJORA: Sección colapsable para mantener la interfaz limpia.
            'classes': ('collapse',),
            'fields': (
                'medical_conditions', 
                'blood_type', 
                'emergency_contact_name', 
                'emergency_contact_phone'
            )
        }),
        ('Metadatos y Permisos', {
            'classes': ('collapse',),
            'fields': ('groups', 'user_permissions', 'is_staff', 'is_superuser', 'date_joined', 'last_login')
        }),
    )

    # MEJORA: Hacer que el internal_code y search_name sean solo lectura para evitar errores humanos.
    readonly_fields = ('search_name', 'date_joined', 'last_login')