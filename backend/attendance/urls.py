# backend/attendance/urls.py

from django.urls import path
from .views import AttendanceListCreateView

urlpatterns = [
    path('', AttendanceListCreateView.as_view(), name='attendance-list-create'),
]