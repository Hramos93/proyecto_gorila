# backend/users/serializers.py

from rest_framework import serializers
from .models import User

class UserBasicSerializer(serializers.ModelSerializer):
    """
    Serializador de solo lectura para anidar en otras respuestas (como asistencias).
    Expone solo los datos públicos no sensibles.
    """
    class Meta:
        model = User
        fields = ['id', 'internal_code', 'first_name', 'last_name', 'document_type', 'document_number', 'role']
        read_only_fields = fields