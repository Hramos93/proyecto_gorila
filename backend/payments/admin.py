# backend/payments/admin.py

from django.contrib import admin
from .models import Plan, Payment

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration_days', 'is_active')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'amount', 'currency', 'payment_date', 'end_date', 'is_active_membership')
    list_filter = ('currency', 'method', 'payment_date')
    search_fields = ('user__first_name', 'user__last_name', 'user__internal_code')

    def is_active_membership(self, obj):
        from django.utils import timezone
        return obj.end_date >= timezone.now().date()
    is_active_membership.boolean = True
    is_active_membership.short_description = '¿Vigente?'