# backend/config/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Versionado de API (Buena práctica arquitectónica)
    path('api/v1/attendance/', include('attendance.urls')),
]