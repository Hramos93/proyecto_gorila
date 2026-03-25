from rest_framework import viewsets, filters
from users.models import User
from .serializers import CustomerSerializer

class CustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows customers (Users) to be viewed.
    """
    queryset = User.objects.filter(role=User.Role.CLIENT).order_by('first_name', 'last_name')
    serializer_class = CustomerSerializer
    
    # --- Filtering and Search ---
    filter_backends = [filters.SearchFilter]
    search_fields = [
        'first_name', 
        'last_name', 
        'document_number',
        'search_name' # Using the normalized field for better performance
    ]
