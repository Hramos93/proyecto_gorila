# backend/users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView, LogoutView, SessionView

# MEJORA: El DefaultRouter registra automáticamente las rutas estándar (GET, POST) 
# y también nuestras acciones personalizadas como 'me'.
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Rutas de autenticación
    path('login/', LoginView.as_view(), name='api_login'),
    path('logout/', LogoutView.as_view(), name='api_logout'),
    path('session/', SessionView.as_view(), name='api_session'),
    
    # MEJORA: Inclusión de las rutas del router para que 'api/v1/users/' sea válida.
    path('', include(router.urls)),
]