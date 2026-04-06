import json
import urllib.request
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from payments.models import Currency, ExchangeRate

class Command(BaseCommand):
    help = 'Sincroniza la tasa oficial del BCV consumiendo DolarApi'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Iniciando sincronización con el BCV...'))
        
        try:
            # 1. Consumimos la API
            url = "https://ve.dolarapi.com/v1/dolares/oficial"
            # Nos hacemos pasar por un navegador genérico para evitar bloqueos
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                
            # Extraemos la tasa (promedio)
            rate_value = Decimal(str(data.get('promedio')))
            
            if not rate_value:
                self.stdout.write(self.style.ERROR('La API no devolvió una tasa válida.'))
                return

            # 2. Buscamos la moneda Bolívar en nuestra base de datos
            ves_currency = Currency.objects.filter(code='VES').first()
            if not ves_currency:
                self.stdout.write(self.style.ERROR('No se encontró la moneda VES en la base de datos.'))
                return

            # 3. Guardamos o actualizamos la tasa del día de hoy
            today = timezone.now().date()
            exchange_rate, created = ExchangeRate.objects.update_or_create(
                currency=ves_currency,
                effective_date=today,
                defaults={'rate': rate_value}
            )

            accion = "CREADA" if created else "ACTUALIZADA"
            self.stdout.write(self.style.SUCCESS(f'✅ Tasa {accion} con éxito: 1 USD = {rate_value} Bs. ({today})'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error al sincronizar: {str(e)}'))