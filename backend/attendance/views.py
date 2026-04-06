from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Attendance, TrainingClass
from .serializers import AttendanceSerializer, BulkAttendanceSerializer, TrainingClassSerializer
from .services import WhatsAppOCRService

from users.models import User 

class AttendanceViewSet(viewsets.ModelViewSet):
    """
    Endpoint de la API para gestionar asistencias.
    Soporta operaciones CRUD completas y procesamiento de imágenes.
    """
    queryset = Attendance.objects.all().order_by('-timestamp').select_related('user')
    serializer_class = AttendanceSerializer
    
    permission_classes = [AllowAny]
    authentication_classes = [] 

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        if user_id is not None:
            queryset = queryset.filter(user__id=user_id)
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['POST'], url_path='manual-checkin')
    def manual_checkin(self, request):
        user_id = request.data.get('user_id')
        raw_trainer_id = request.data.get('trainer_id')
        raw_class_id = request.data.get('class_id')

        # --- CANDADOS DE SEGURIDAD OBLIGATORIOS ---
        if not user_id:
            return Response({"error": "El ID del usuario es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        trainer_id = raw_trainer_id if raw_trainer_id else None
        class_id = raw_class_id if raw_class_id else None

        if not trainer_id or not class_id:
            return Response({"error": "Debe seleccionar un entrenador y una clase de forma obligatoria."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user = User.objects.get(id=user_id, role='CLIENT', is_active=True)
                
                attendance = Attendance.objects.create(
                    user=user,
                    trainer_id=trainer_id, 
                    training_class_id=class_id, 
                    entry_method='MANUAL'
                )
                
                user.refresh_from_db()

            return Response({
                'message': 'Asistencia registrada con éxito.',
                'remaining_classes': user.remaining_classes,
                'is_debt': getattr(attendance, 'is_debt', False)
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({'error': 'Socio no encontrado o inactivo.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error al procesar asistencia: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['POST'], url_path='bulk-confirm')
    def bulk_confirm(self, request):
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        user_ids = validated_data['user_ids']
        entry_method = validated_data['entry_method']
        
        trainer_id = validated_data['trainer_id']
        class_id = validated_data['class_id']

        try:
            with transaction.atomic():
                # --- MAGIA DE TIEMPO: Fecha seleccionada + Hora actual del sistema ---
                now = timezone.localtime() # Capturamos la hora exacta en este momento
                attendance_timestamp = validated_data.get('attendance_date', now)
                
                # Si React envió una fecha, reemplazamos sus 00:00:00 por la hora actual
                if 'attendance_date' in validated_data:
                    attendance_timestamp = attendance_timestamp.replace(
                        hour=now.hour, 
                        minute=now.minute, 
                        second=now.second,
                        microsecond=now.microsecond
                    )

                users = User.objects.filter(id__in=user_ids)
                user_dict = {u.id: u for u in users}
                
                # Bucle de creación con la hora del sistema
                for uid in user_ids:
                    user = user_dict.get(uid)
                    if user:
                        Attendance.objects.create(
                            user=user,
                            entry_method=entry_method,
                            timestamp=attendance_timestamp,
                            trainer_id=trainer_id,
                            training_class_id=class_id
                        )
            
            return Response(
                {"detail": f"{len(user_ids)} asistencias registradas con éxito."},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"error": f"Error durante la creación masiva: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['POST'], parser_classes=[MultiPartParser, FormParser], url_path='upload-whatsapp')
    def upload_whatsapp(self, request):
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

    @action(detail=False, methods=['GET'], url_path='trainers')
    def get_trainers(self, request):
        trainers = User.objects.filter(role__in=['STAFF', 'ADMIN'], is_active=True)
        
        data = [
            {
                "id": t.id, 
                "first_name": t.first_name, 
                "last_name": t.last_name,
                "internal_code": t.internal_code
            } 
            for t in trainers
        ]
        return Response(data, status=status.HTTP_200_OK)
        

class TrainingClassViewSet(viewsets.ModelViewSet):
    queryset = TrainingClass.objects.filter(is_active=True).order_by('schedule_time')
    serializer_class = TrainingClassSerializer
    permission_classes = [AllowAny]