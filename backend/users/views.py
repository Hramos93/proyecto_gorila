# backend/users/views.py
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import UserBasicSerializer

class LoginView(APIView):
    permission_classes = [AllowAny] # Cualquiera puede intentar iniciar sesión

    def post(self, request, format=None):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            serializer = UserBasicSerializer(user)
            return Response(serializer.data)
        else:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated] # Solo usuarios logueados pueden salir

    def post(self, request, format=None):
        logout(request)
        return Response({'detail': 'Sesión cerrada correctamente.'}, status=status.HTTP_200_OK)

class SessionView(APIView):
    permission_classes = [IsAuthenticated] # Verifica la sesión para usuarios autenticados

    def get(self, request, format=None):
        serializer = UserBasicSerializer(request.user)
        return Response(serializer.data)