# backend/customers/serializers.py
from rest_framework import serializers
from users.models import User

class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer completo para el detalle y lista de clientes.
    """
    dni = serializers.CharField(source='document_number', read_only=True)
    payment_status = serializers.CharField(source='payment_status_db', read_only=True)
    last_attendance = serializers.DateTimeField(source='last_attendance_annotated', read_only=True)
    latest_payment_end_date = serializers.DateField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'first_name', 
            'last_name', 
            'dni', 
            'document_type',
            'document_number', 
            'phone_number', # <--- CORREGIDO: Cambiado de 'phone' a 'phone_number'
            'internal_code',
            'last_attendance', 
            'payment_status',
            'remaining_classes', 
            'latest_payment_end_date'
        ]

class CustomerBoardCardSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para la vista de tablero (Kanban).
    """
    payment_status = serializers.CharField(source='payment_status_db', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'first_name', 
            'last_name', 
            'internal_code', 
            'payment_status',
            'remaining_classes'
        ]