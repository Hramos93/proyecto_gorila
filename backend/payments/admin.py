from django.contrib import admin
from .models import Plan, Currency, ExchangeRate, Invoice, Payment

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('codPlan', 'name', 'price', 'duration_days', 'class_limit', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('codPlan', 'name')
    list_editable = ('price', 'is_active')

@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ('code', 'symbol', 'is_base')
    list_filter = ('is_base',)
    search_fields = ('code',)

@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ('currency', 'rate', 'effective_date', 'created_at')
    list_filter = ('currency', 'effective_date')
    date_hierarchy = 'effective_date'

# Esto permite ver y agregar pagos directamente desde la pantalla de la Factura
class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ('equivalent_usd',)

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'plan', 'amount_usd', 'amount_ves', 'status', 'emission_date')
    list_filter = ('status', 'emission_date', 'plan')
    search_fields = ('user__first_name', 'user__last_name', 'user__internal_code')
    readonly_fields = ('status',) # El status se auto-calcula con los pagos
    inlines = [PaymentInline]

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'invoice', 'method', 'amount_paid', 'currency', 'equivalent_usd', 'payment_date')
    list_filter = ('method', 'currency', 'payment_date')
    search_fields = ('reference', 'invoice__user__first_name', 'invoice__user__last_name')
    readonly_fields = ('equivalent_usd',) # Se auto-calcula por la tasa