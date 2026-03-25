from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Attendance
from .serializers import AttendanceSerializer, BulkAttendanceSerializer
from .services import WhatsAppOCRService

class AttendanceViewSet(viewsets.ModelViewSet):
    """
    Endpoint de la API para gestionar asistencias.
    Soporta operaciones CRUD completas y procesamiento de imágenes.
    """
    queryset = Attendance.objects.all().order_by('-timestamp').select_related('user')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def stats(self, request):
        """
        Devuelve estadísticas de asistencia en tiempo real.
        """
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        two_hours_ago = now - timedelta(hours=2)

        total_today = self.get_queryset().filter(timestamp__gte=start_of_day).count()
        active_now = self.get_queryset().filter(timestamp__gte=two_hours_ago).count()
        
        recent_attendances = self.get_queryset()[:10]
        recent_serializer = self.get_serializer(recent_attendances, many=True)

        return Response({
            'total_today': total_today,
            'active_now': active_now,
            'recent': recent_serializer.data,
        })

    def create(self, request, *args, **kwargs):
        """
        Registro de asistencia manual estándar.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['POST'], url_path='bulk-confirm')
    def bulk_confirm(self, request):
        """
        Registra la asistencia para múltiples usuarios de forma masiva.
        Espera una lista de 'user_ids', un 'entry_method' y una 'attendance_date' opcional.
        """
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        user_ids = validated_data['user_ids']
        entry_method = validated_data['entry_method']
        
        # Usar la fecha del serializador o la actual si no se proveyó
        attendance_timestamp = validated_data.get('attendance_date', timezone.now())

        try:
            with transaction.atomic():
                attendances_to_create = [
                    Attendance(
                        user_id=user_id, 
                        entry_method=entry_method,
                        timestamp=attendance_timestamp
                    )
                    for user_id in user_ids
                ]
                Attendance.objects.bulk_create(attendances_to_create)
            
            return Response(
                {"detail": f"{len(user_ids)} asistencias registradas con éxito en la fecha {attendance_timestamp.strftime('%Y-%m-%d %H:%M:%S')}."},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": f"Error durante la creación masiva: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['POST'], parser_classes=[MultiPartParser, FormParser], url_path='upload-whatsapp', permission_classes=[AllowAny])
    def upload_whatsapp(self, request):
        """
        Recibe una imagen (captura de WhatsApp), la procesa y devuelve los clientes detectados.
        """
        file_obj = request.FILES.get('image')
        
        if not file_obj:
            return Response(
                {"error": "No se proporcionó ninguna imagen."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ocr_service = WhatsAppOCRService(file_obj)
            result = ocr_service.process()
            return Response(result, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {"error": f"Error interno procesando la imagen: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
