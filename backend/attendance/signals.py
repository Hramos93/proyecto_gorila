# backend/attendance/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Attendance

# FANTASMA ELIMINADO 👻
# La lógica de actualizar `last_attendance_date` y descontar `remaining_classes` 
# se trasladó al método save() de models.py usando operaciones atómicas con F() 
# para evitar condiciones de carrera y dobles descuentos.