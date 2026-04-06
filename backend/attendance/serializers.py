# backend/attendance/serializers.py

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from .models import Attendance, TrainingClass

User = get_user_model()

class AttendanceSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Attendance con trazabilidad detallada.
    """
    user_details = serializers.StringRelatedField(source='user', read_only=True)
    trainer_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id',
            'user',         
            'user_details', 
            'timestamp',    
            'entry_method',
            'ocr_raw_text',
            'trainer_name',
            'class_name',
        ]
        read_only_fields = ('id', 'user_details')
        extra_kwargs = {'timestamp': {'required': False}}

    def get_trainer_name(self, obj):
        if obj.trainer:
            return f"{obj.trainer.first_name} {obj.trainer.last_name}".strip()
        return "Sistema"

    def get_class_name(self, obj):
        if obj.training_class:
            # Formateamos la hora para que se vea como '07:30 PM'
            time_str = obj.training_class.schedule_time.strftime('%I:%M %p')
            return f"{obj.training_class.name} {time_str}"
        return "Entrenamiento Libre"

class BulkAttendanceSerializer(serializers.Serializer):
    user_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)
    entry_method = serializers.ChoiceField(choices=Attendance.EntryMethod.choices)
    attendance_date = serializers.DateTimeField(required=False)
    
    # ESTOS SON LOS DOS CAMPOS NUEVOS QUE DEBEN ESTAR AQUÍ
    trainer_id = serializers.IntegerField(required=True)
    class_id = serializers.IntegerField(required=True)

    def validate_user_ids(self, user_ids):
        existing_users_count = User.objects.filter(pk__in=user_ids).count()
        if existing_users_count != len(user_ids):
            raise serializers.ValidationError("Uno o más IDs de usuario no existen.")
        return user_ids

    def validate_attendance_date(self, value):
        if value and value > timezone.now():
            raise serializers.ValidationError("La fecha no puede ser futura.")
        return value
    
class TrainingClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingClass
        fields = ['id', 'name', 'schedule_time', 'is_active']