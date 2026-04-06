# backend/users/serializers.py

from rest_framework import serializers
from .models import User
# Añade este import en la parte superior
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Añade esta clase al final del archivo
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Personaliza la respuesta del Login JWT para incluir los datos del usuario,
    manteniendo la compatibilidad con nuestro frontend actual en React.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Inyectamos el usuario usando tu serializador existente
        serializer = UserBasicSerializer(self.user, context=self.context)
        data['user'] = serializer.data
        
        # Eliminamos la necesidad de devolver csrfToken
        return data

class UserBasicSerializer(serializers.ModelSerializer):
    """
    REPARACIÓN: Serializador básico para sesiones y autenticación.
    Necesario para que LoginView y SessionView funcionen.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'avatar']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer principal para el modelo User.
    Incluye todos los nuevos campos de identidad y salud para Energy Box.
    """
    internal_code = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'role', 'document_type', 'document_number', 'internal_code',
            'phone_number', 'address', 'avatar', 'avatar_url',
            'medical_conditions', 'blood_type', 'emergency_contact_name', 
            'emergency_contact_phone', 'search_name'
        ]
        read_only_fields = ('id', 'internal_code', 'search_name')

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para la creación de nuevos usuarios.
    """
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'document_type', 
            'document_number', 'phone_number', 'role'
        ]

    def create(self, validated_data):
        username = validated_data.get('document_number')
        user = User.objects.create_user(
            username=username,
            password=username,
            **validated_data
        )
        return user
    
# Añade esta clase al final del archivo
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Personaliza la respuesta del Login JWT para incluir los datos del usuario,
    manteniendo la compatibilidad con nuestro frontend actual en React.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Inyectamos el usuario usando tu serializador existente
        serializer = UserBasicSerializer(self.user, context=self.context)
        data['user'] = serializer.data
        
        # Eliminamos la necesidad de devolver csrfToken
        return data