# backend/users/serializers.py
from rest_framework import serializers
from .models import User

class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para la creación rápida de usuarios.
    Genera un nombre de usuario y contraseña por defecto.
    """
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'document_type', 'document_number']

    def validate(self, data):
        """
        Validación a nivel de objeto para comprobar la unicidad del documento.
        """
        if User.objects.filter(
            document_type=data.get('document_type'), 
            document_number=data.get('document_number')
        ).exists():
            raise serializers.ValidationError("Ya existe un usuario con este documento de identidad.")
        return data

    def create(self, validated_data):
        """
        Crea el usuario, estableciendo un nombre de usuario y contraseña por defecto.
        """
        # Usamos el número de documento como nombre de usuario único.
        validated_data['username'] = validated_data['document_number']
        
        user = User.objects.create_user(**validated_data)
        
        # ADVERTENCIA DE SEGURIDAD: Usar el DNI como contraseña es predecible.
        # Para un entorno de producción, considera generar una contraseña aleatoria
        # o implementar un flujo de "olvidé mi contraseña" para el primer inicio de sesión.
        user.set_password(validated_data['document_number'])
        user.save()

        return user

class UserBasicSerializer(serializers.ModelSerializer):
    """
    Serializador de solo lectura para anidar en otras respuestas (como asistencias).
    Expone solo los datos públicos no sensibles.
    
    NUEVO: Incluye 'payment_status' y 'avatar_url' para enriquecer la UI.
    'payment_status' debe ser anotado en el queryset de la vista que lo use.
    'avatar_url' se genera a partir del campo 'avatar' del modelo User.
    """
    avatar_url = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        # Añadimos los nuevos campos para la UI refactorizada
        fields = [
            'id', 
            'internal_code', 
            'first_name', 
            'last_name', 
            'document_type', 
            'document_number', 
            'role',
            'avatar_url',       # <-- NUEVO
            'payment_status'    # <-- NUEVO
        ]
        read_only_fields = fields

    def get_payment_status(self, obj):
        # Usamos getattr para evitar el Error 500 si la vista no lo anota.
        return getattr(obj, 'payment_status', 'PENDING')

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if hasattr(obj, 'avatar') and obj.avatar and hasattr(obj.avatar, 'url'):
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None