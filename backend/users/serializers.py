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
        
        # Opcional: Establecer una contraseña por defecto si es necesario
        user.set_password(validated_data['document_number'])
        user.save()

        return user

class UserBasicSerializer(serializers.ModelSerializer):
    """
    Serializador de solo lectura para anidar en otras respuestas (como asistencias).
    Expone solo los datos públicos no sensibles.
    """
    class Meta:
        model = User
        fields = ['id', 'internal_code', 'first_name', 'last_name', 'document_type', 'document_number', 'role']
        read_only_fields = fields