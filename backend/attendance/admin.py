# backend/attendance/admin.py

from django.contrib import admin
from .models import Attendance

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    """
    Configuración del panel de administración para el historial de Asistencias.
    """
    
    # Columnas en la vista de lista
    list_display = ('user', 'get_internal_code', 'timestamp', 'entry_method')
    
    # Filtros laterales útiles
    list_filter = ('entry_method', 'timestamp')
    
    # Búsqueda a través de relaciones (buscamos por datos del usuario asociado)
    search_fields = ('user__internal_code', 'user__first_name', 'user__last_name', 'user__document_number')
    
    # El timestamp es automático, no debe ser editable
    readonly_fields = ('timestamp',)

    # Método personalizado para mostrar el código interno en la tabla
    def get_internal_code(self, obj):
        return obj.user.internal_code
    get_internal_code.short_description = 'Código Interno' # Nombre de la columna