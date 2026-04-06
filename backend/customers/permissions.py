# backend/customers/permissions.py
from rest_framework import permissions

class IsEnergyBoxAdmin(permissions.BasePermission):
    """
    Permiso estricto: Solo usuarios con rol 'ADMIN'.
    Ideal para ver reportes financieros y contabilidad.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )

class IsStaffOrAdmin(permissions.BasePermission):
    """
    Permiso operativo: Entrenadores (STAFF) y Administradores (ADMIN).
    Ideal para el tablero CRM, asistencia y ver perfiles de clientes.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'STAFF']
        )