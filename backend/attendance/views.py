# backend/attendance/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Attendance
from .serializers import AttendanceSerializer
from .services import WhatsAppOCRService  # Importamos nuestro motor OCR

class AttendanceViewSet(viewsets.ModelViewSet):
    """
    Endpoint de la API para gestionar asistencias.
    Soporta operaciones CRUD completas y procesamiento de imágenes.
    """
    queryset = Attendance.objects.all().select_related('user')
    serializer_class = AttendanceSerializer
    permission_classes = [] 

    def create(self, request, *args, **kwargs):
        """
        Registro de asistencia manual estándar.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # --- NUEVO ENDPOINT PARA EL OCR ---
    # detail=False significa que afecta a la colección (no a un ID específico)
    @action(detail=False, methods=['POST'], parser_classes=[MultiPartParser, FormParser], url_path='upload-whatsapp')
    def upload_whatsapp(self, request):
        """
        Recibe una imagen (captura de WhatsApp), la procesa y devuelve los clientes detectados.
        """
        # 'image' será el nombre del campo (key) que React enviará en el FormData
        file_obj = request.FILES.get('image')
        
        if not file_obj:
            return Response(
                {"error": "No se proporcionó ninguna imagen."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 1. Instanciamos el servicio con la imagen en memoria
            ocr_service = WhatsAppOCRService(file_obj)
            
            # 2. Ejecutamos el pipeline (OpenCV -> Tesseract -> Fuzzy Matching)
            result = ocr_service.process()
            
            # 3. Retornamos el JSON al frontend para que el entrenador confirme
            return Response(result, status=status.HTTP_200_OK)
        
        except Exception as e:
            # Capturamos cualquier error (ej. Tesseract no configurado correctamente)
            return Response(
                {"error": f"Error interno procesando la imagen: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )