from django.db import models
from django.db.models import Max, Value, Case, When, CharField, Q
from django.utils import timezone
from rest_framework import viewsets
from users.models import User
from .serializers import CustomerSerializer
from .permissions import IsStaffOrAdmin 

class CustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vista optimizada para la gestión de clientes en Energy Box.
    Centraliza la lógica de estados de pago y créditos de clase.
    """
    serializer_class = CustomerSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        today = timezone.now().date()
        
        return User.objects.filter(role='CLIENT', is_active=True).annotate(
            # 1. Traemos la fecha desnormalizada de asistencia
            last_attendance_annotated=models.F('last_attendance_date'),
            
            # 2. CORREGIDO: Ahora calculamos la fecha en base a la nueva tabla de Facturas (invoices)
            latest_payment_end_date_calc=Max('invoices__end_date')
        ).annotate(
            # Asignamos el valor calculado a un nombre que el serializer reconozca
            latest_payment_end_date=models.F('latest_payment_end_date_calc'),
            
            # 3. LÓGICA UNIFICADA: Semáforo de pagos + Clases restantes
            payment_status_db=Case(
                # Condición A: Vencido por falta de clases (<= 0) O por fecha expirada
                When(
                    Q(remaining_classes__lte=0) | Q(latest_payment_end_date_calc__lt=today), 
                    then=Value('OVERDUE')
                ),
                # Condición B: Activo porque tiene clases (> 0) Y su fecha está vigente
                When(
                    Q(remaining_classes__gt=0) & Q(latest_payment_end_date_calc__gte=today), 
                    then=Value('PAID')
                ),
                # Por defecto (ej. cliente nuevo que no ha pagado nunca)
                default=Value('PENDING'),
                output_field=CharField(),
            )
        ).order_by('first_name')