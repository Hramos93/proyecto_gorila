from django.contrib import admin
from .models import Plan, Payment

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    """Configuración del admin para el modelo Plan."""
    list_display = ('name', 'duration_days', 'price', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    ordering = ('duration_days',)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Configuración del admin para el modelo Payment."""
    list_display = ('user', 'plan', 'payment_date', 'start_date', 'end_date', 'amount_paid', 'payment_method')
    list_filter = ('plan', 'payment_method', 'payment_date')
    search_fields = ('user__first_name', 'user__last_name', 'user__document_number')
    autocomplete_fields = ('user', 'plan') # Mejora la selección en lugar de un dropdown gigante
    ordering = ('-payment_date',)
    date_hierarchy = 'payment_date' # Permite navegar por fechas

    fieldsets = (
        (None, {
            'fields': ('user', 'plan', 'amount_paid', 'payment_method')
        }),
        ('Fechas de Cobertura', {
            'fields': ('payment_date', 'start_date', 'end_date')
        }),
        ('Información Adicional', {
            'fields': ('notes',),
            'classes': ('collapse',) # Oculta esta sección por defecto
        }),
    )

