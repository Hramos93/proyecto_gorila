from rest_framework import permissions

class IsEnergyBoxAdmin(permissions.BasePermission):
    """
    Permite acceso si el usuario tiene el rol 'ADMIN' en su modelo.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )