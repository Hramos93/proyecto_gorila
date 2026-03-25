from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User
from .serializers import UserCreateSerializer, UserBasicSerializer

class UserViewSet(viewsets.GenericViewSet):
    """
    ViewSet para operaciones relacionadas con usuarios.
    """
    queryset = User.objects.all()
    
    @action(detail=False, methods=['POST'], url_path='quick-create')
    def quick_create(self, request):
        """
        Crea un nuevo usuario (cliente) de forma rápida.
        """
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Devolvemos los datos básicos del usuario recién creado
        response_serializer = UserBasicSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['GET'], url_path='search')
    def search(self, request):
        """
        Busca usuarios por nombre, apellido o número de documento.
        """
        query = request.query_params.get('q', None)
        if not query or len(query) < 2:
            return Response([], status=status.HTTP_200_OK)

        # Buscamos coincidencias en varios campos
        users = User.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(internal_code__icontains=query) |
            Q(document_number__icontains=query)
        )[:10]  # Limitamos a 10 resultados para no sobrecargar
        
        serializer = UserBasicSerializer(users, many=True)
        return Response(serializer.data)

