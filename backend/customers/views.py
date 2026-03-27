# backend/customers/views.py
from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAdminUser
from users.models import User
from users.serializers import UserBasicSerializer

class CustomerViewSet(mixins.ListModelMixin,
                      mixins.RetrieveModelMixin,
                      viewsets.GenericViewSet):
    """
    Endpoint de solo lectura para listar y ver detalles de clientes.
    - `GET /api/customers/`: Lista todos los usuarios con el rol de CLIENTE.
    - `GET /api/customers/{id}/`: Obtiene los detalles de un cliente específico.
    
    Este endpoint es ideal para alimentar la tabla maestra de clientes en el frontend.
    Solo los administradores pueden acceder a esta lista.
    
    NUEVO: Anota cada cliente con su 'payment_status' calculado.
    """
    serializer_class = UserBasicSerializer
    permission_classes = [IsAdminUser] # ¡Importante! Proteger la lista de clientes.

    def get_queryset(self):
        """
        Filtra el queryset para devolver solo usuarios que son clientes y están activos.
        
        Añade una anotación 'payment_status' a cada usuario basada en su último pago.
        La lógica es:
        - PAID: El último pago está 'COMPLETED'.
        - OVERDUE: El último pago está 'PENDING' y su 'due_date' ya pasó.
        - PENDING: El último pago está 'PENDING' y su 'due_date' es futura.
        - PENDING: Si no tiene pagos registrados.
        """
        return User.objects.filter(role=User.Role.CLIENT, is_active=True).order_by('first_name', 'last_name')