# backend/attendance/serializers.py

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from .models import Attendance

# Obtener el modelo de usuario activo de Django
User = get_user_model()


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
            'timestamp',    # Ahora es opcional. Si no se envía, se usa el default del modelo.
            'entry_method',
            'ocr_raw_text',
        ]
        # El timestamp ya no es read_only para permitir back-dating.
        read_only_fields = ('id', 'user_details')
        extra_kwargs = {'timestamp': {'required': False}}


class BulkAttendanceSerializer(serializers.Serializer):
    """
    Serializer para la creación masiva de asistencias.
    Valida que los IDs de usuario existan y el método de entrada sea válido.
    """
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        help_text="Lista de IDs de los usuarios a los que se les registrará asistencia."
    )
    entry_method = serializers.ChoiceField(
        choices=Attendance.EntryMethod.choices,
        help_text="Método de registro de la asistencia (ej. WHATSAPP)."
    )
    attendance_date = serializers.DateTimeField(
        required=False,
        help_text="Fecha y hora de la asistencia (opcional, formato ISO 8601). Si no se provee, se usa la fecha actual."
    )

    def validate_user_ids(self, user_ids):
        """
        Comprueba que todos los IDs de la lista correspondan a usuarios reales.
        """
        # Contamos cuántos de los IDs proporcionados existen en la DB
        existing_users_count = User.objects.filter(pk__in=user_ids).count()
        
        # Si el conteo no coincide con la longitud de la lista, hay IDs inválidos.
        if existing_users_count != len(user_ids):
            raise serializers.ValidationError("Uno o más IDs de usuario no existen.")
            
        return user_ids

    def validate_attendance_date(self, value):
        """
        Valida que la fecha de asistencia no sea en el futuro.
        """
        if value and value > timezone.now():
            raise serializers.ValidationError("La 'attendance_date' no puede ser una fecha futura.")
        return value