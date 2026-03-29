# backend/customers/views.py
from django.db.models import Max, Value, Case, When, CharField
from django.utils import timezone
from rest_framework import viewsets
from users.models import User
from .serializers import CustomerSerializer
from rest_framework.permissions import IsAuthenticated

class CustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vista optimizada para la gestión de clientes en Energy Box.
    """
    serializer_class = CustomerSerializer
    # REPARACIÓN: Usamos IsAuthenticated para que reconozca a tu usuario Administrador
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        today = timezone.now().date()
        # Filtramos solo los usuarios que son CLIENTES para la tabla
        return User.objects.filter(role='CLIENT', is_active=True).annotate(
            last_attendance_annotated=Max('attendances__timestamp'),
            latest_payment_end_date=Max('payments__end_date')
        ).annotate(
            payment_status_db=Case(
                When(latest_payment_end_date__gte=today, then=Value('PAID')),
                When(latest_payment_end_date__lt=today, then=Value('OVERDUE')),
                default=Value('PENDING'),
                output_field=CharField(),
            )
        ).order_by('first_name')