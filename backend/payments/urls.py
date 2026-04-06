from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlanViewSet, CurrencyViewSet, ExchangeRateViewSet, 
    InvoiceViewSet, PaymentViewSet
)

router = DefaultRouter()
router.register(r'plans', PlanViewSet)
router.register(r'currencies', CurrencyViewSet)
router.register(r'exchange-rates', ExchangeRateViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'transactions', PaymentViewSet) # Lo llamamos transactions para la URL

urlpatterns = [
    path('', include(router.urls)),
]