# backend/attendance/apps.py
from django.apps import AppConfig

class AttendanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'attendance'

    def ready(self):
        """
        Este método se ejecuta cuando Django inicia. 
        Importamos las señales aquí para que los 'receivers' se registren.
        """
        import attendance.signals