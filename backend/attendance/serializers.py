# backend/attendance/serializers.py

from rest_framework import serializers
from .models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Attendance.
    """
    # Campo de solo lectura para mostrar una representación legible del usuario (usará el __str__ del modelo User).
    user_details = serializers.StringRelatedField(source='user', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'user',         # Campo de escritura, espera el ID del usuario al crear.
            'user_details', # Campo de solo lectura para mostrar en listados.
            'timestamp',
            'entry_method',
            'ocr_raw_text',
        ]
        # Campos que no se deben poder editar a través de la API.
        read_only_fields = ('id', 'timestamp', 'user_details')