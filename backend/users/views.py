# backend/users/views.py

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User
from .serializers import UserSerializer, UserCreateSerializer, UserBasicSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
    Vista principal para gestionar usuarios.
    Soporta operaciones de creación, edición y visualización de perfiles.
    """
    queryset = User.objects.all().order_by('internal_code')
    
    def get_serializer_class(self):
        """
        MEJORA: Alterna entre serializadores según la acción (Creación vs. Ver).
        """
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        MEJORA: Endpoint para obtener el perfil del usuario logueado actualmente.
        """
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

class LoginView(views.APIView):
    """
    Vista para manejar el inicio de sesión.
    Se desactiva la autenticación por sesión para evitar el bloqueo CSRF 
    durante el primer intento de login (El problema del Huevo y la Gallina).
    """
    permission_classes = [AllowAny]
    authentication_classes = [] # <--- ESTA ES LA MAGIA QUE ARREGLA EL ERROR 403

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Authenticate verifica las credenciales en la base de datos
        user = authenticate(request, username=username, password=password)
        
        if user:
            # login() crea la sesión en el servidor e inyecta las cookies 
            # (sessionid y csrftoken) en la respuesta para el navegador.
            login(request, user)
            
            serializer = UserBasicSerializer(user, context={'request': request})
            return Response({
                "detail": "Inicio de sesión exitoso.",
                "user": serializer.data,
                "csrfToken": get_token(request) 
            })
        
        return Response(
            {"detail": "Credenciales inválidas."}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

class LogoutView(views.APIView):
    """
    Vista para cerrar sesión.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Sesión cerrada correctamente."})

class SessionView(views.APIView):
    """
    Vista para verificar si la sesión del usuario sigue activa.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            serializer = UserBasicSerializer(request.user, context={'request': request})
            return Response({"isAuthenticated": True, "user": serializer.data})
        return Response({"isAuthenticated": False}, status=status.HTTP_200_OK)