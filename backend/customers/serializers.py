from rest_framework import serializers
from django.db.models import Max
from users.models import User
from attendance.models import Attendance

class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for the Customer (User) model, optimized for list views.
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    dni = serializers.CharField(source='document_number', read_only=True)
    last_attendance_date = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'phone',
            'dni',
            'last_attendance_date',
            'is_active', # For status column in UI
        ]

    def get_last_attendance_date(self, obj):
        """
        Returns the timestamp of the most recent attendance record for the user.
        """
        last_attendance = obj.attendances.aggregate(latest_timestamp=Max('timestamp'))
        return last_attendance['latest_timestamp']

