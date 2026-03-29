from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Panel administrativo de Django
    path('admin/', admin.site.urls),
    
    # --- API V1 Routes ---
    # MEJORA: Organización centralizada de todas las aplicaciones del CRM.
    path('api/v1/', include('users.urls')),
    path('api/v1/', include('attendance.urls')),
    path('api/v1/', include('customers.urls')),
    
    # MEJORA: Conexión del módulo de pagos que estaba ausente en la configuración original.
    path('api/v1/', include('payments.urls')),

]

# MEJORA: Activación de la ruta de archivos MEDIA (Fotos de perfil, OCR, Comprobantes).
# Esto permite que Django sirva las imágenes guardadas en la carpeta /media durante el desarrollo.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)