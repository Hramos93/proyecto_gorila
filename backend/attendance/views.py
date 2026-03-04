# backend/attendance/views.py

from rest_framework import generics, permissions
from .models import Attendance
from .serializers import AttendanceSerializer

class AttendanceListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar todas las asistencias (GET) o registrar una nueva (POST).
    """
    queryset = Attendance.objects.select_related('user').all()
    serializer_class = AttendanceSerializer
    # Es una buena práctica proteger tus endpoints.
    # permission_classes = [permissions.IsAuthenticated]