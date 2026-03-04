# backend/users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Configuración del panel de administración para el modelo de Usuario personalizado.
    Extendemos UserAdmin para mantener la lógica de contraseñas de Django.
    """
    
    # 1. Columnas que se mostrarán en la lista general de usuarios
    list_display = (
        'internal_code', 'username', 'first_name', 'last_name', 
        'role', 'document_type', 'document_number', 'is_active'
    )
    
    # 2. Filtros laterales para búsquedas rápidas
    list_filter = ('role', 'document_type', 'is_active', 'is_staff')
    
    # 3. Barra de búsqueda superior (busca por estos campos)
    search_fields = ('internal_code', 'document_number', 'first_name', 'last_name', 'username')
    
    # 4. Campos de solo lectura (No queremos que un admin modifique manualmente el código autogenerado)
    readonly_fields = ('internal_code',)

    # 5. Organización del formulario al crear/editar un usuario
    fieldsets = UserAdmin.fieldsets + (
        ('Información de Energy Box', {
            'fields': (
                'role', 'internal_code', 'document_type', 'document_number', 
                'phone', 'address'
            )
        }),
        ('Datos Médicos y Emergencia', {
            'fields': (
                'birth_date', 'blood_type', 'medical_conditions', 
                'emergency_contact_name', 'emergency_phone'
            )
        }),
    )
    
    # Organización de los campos al crear un usuario nuevo desde cero
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Inicial de Energy Box', {
            'fields': (
                'role', 'document_type', 'document_number', 
                'first_name', 'last_name'
            )
        }),
    )