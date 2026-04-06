# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Panel administrativo de Django
    path('admin/', admin.site.urls),
    
    # --- API V1 Routes ---
    path('api/v1/', include('users.urls')),
    path('api/v1/', include('attendance.urls')),
    path('api/v1/', include('customers.urls')),
    
    # Conexión del módulo de pagos
    path('api/v1/payments/', include('payments.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)