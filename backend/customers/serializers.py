# backend/customers/serializers.py

from rest_framework import serializers
from users.models import User

# backend/customers/serializers.py
class CustomerSerializer(serializers.ModelSerializer):
    # Mantenemos dni para compatibilidad, pero agregamos los campos originales
    dni = serializers.CharField(source='document_number', read_only=True)
    payment_status = serializers.CharField(source='payment_status_db', read_only=True)
    last_attendance = serializers.DateTimeField(source='last_attendance_annotated', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'first_name', 
            'last_name', 
            'dni', 
            'document_type',   # AGREGADO: Para que aparezca la V o J
            'document_number', # AGREGADO: Para que el filtro del frontend funcione
            'phone_number', 
            'internal_code',
            'last_attendance', 
            'payment_status'
        ]


class CustomerBoardCardSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para la vista de tablero (Kanban).
    Muestra solo la información necesaria para las tarjetas.
    """
    payment_status = serializers.CharField(source='payment_status_db', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'first_name', 
            'last_name', 
            'internal_code', 
            'payment_status'
        ]