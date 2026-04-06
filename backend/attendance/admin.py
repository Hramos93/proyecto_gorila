from django.contrib import admin
# 1. Agregamos TrainingClass a la importación
from .models import Attendance, TrainingClass 

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


# --- NUEVA SECCIÓN PARA TRAINING CLASS ---

@admin.register(TrainingClass)
class TrainingClassAdmin(admin.ModelAdmin):
    """
    Configuración del panel de administración para las Clases de Entrenamiento.
    """
    # Nota: Actualiza estos campos con los nombres reales que pusiste en tu modelo TrainingClass
    # Por ejemplo, si tienes campos llamados 'name', 'coach' y 'start_time':
    # list_display = ('name', 'coach', 'start_time') 
    
    # Si por ahora solo quieres que el modelo aparezca en el admin sin personalizar 
    # las columnas, puedes descomentar "pass" y comentar "list_display"
    pass