import csv
import os
import re
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.timezone import make_aware
from dateutil.parser import parse
from users.models import User

class Command(BaseCommand):
    help = 'Import customers from the Ficha de clientes.csv file.'

    def handle(self, *args, **options):
        # Create a dummy CSV for demonstration as the real file is not provided
        self.create_dummy_csv()

        csv_file_path = os.path.join(settings.BASE_DIR, 'data_imports', 'raw', 'Ficha de clientes.csv')
        self.stdout.write(self.style.SUCCESS(f'Starting customer import from: {csv_file_path}'))

        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR('CSV file not found.'))
            return

        successful_imports = 0
        skipped_rows = 0

        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.reader(file)
            header = [h.strip() for h in next(reader)]
            
            # Create a dictionary from the header
            header_map = {h: i for i, h in enumerate(header)}

            def get_val(col_name):
                idx = header_map.get(col_name)
                return cleaned_row[idx] if idx is not None and idx < len(cleaned_row) else ''

            for i, row in enumerate(reader, 2):
                try:
                    # Clean all values
                    cleaned_row = [val.strip() for val in row]

                    # Extract DNI and handle float format
                    dni_raw = get_val('Cédula de Identidad')
                    dni_raw = get_val('Cédula de Identidad ') if not dni_raw else dni_raw # Fallback for dummy csv
                    dni = str(int(float(dni_raw))) if '.' in dni_raw else dni_raw

                    if not dni:
                        self.stdout.write(self.style.WARNING(f'Skipping row {i}: DNI is missing.'))
                        skipped_rows += 1
                        continue

                    # Parse timestamp
                    timestamp_str = get_val('Marca temporal')
                    registration_date = make_aware(parse(timestamp_str)) if timestamp_str else None
                    if not registration_date:
                        self.stdout.write(self.style.WARNING(f'Skipping row {i} for DNI {dni}: Registration date is missing.'))
                        skipped_rows += 1
                        continue

                    # Convert boolean
                    has_medical_condition = get_val('¿Tiene alguna lesión, condición médica o alergia que debamos conocer?') == 'Sí'

                    phone_raw = get_val('Número de Teléfono Principal')

                    customer_data = {
                        'first_name': get_val('Nombre'),
                        'last_name': get_val('Apellido'),
                        'phone': re.sub(r'\D', '', phone_raw) if phone_raw else '',
                        'emergency_contact_name': get_val('Nombre Completo del Contacto de Emergencia') or None,
                        'emergency_phone': get_val('Número de Teléfono del Contacto de Emergencia ') or None,
                        'address': get_val('Dirección de Residencia Completa') or None,
                        'has_injuries': has_medical_condition,
                        'injury_details': get_val("Si respondió 'Sí' en la pregunta anterior, por favor especifique.") or None,
                        'role': User.Role.CLIENT,
                        'username': dni, # AbstractUser requiere un username, usamos el DNI
                        'date_joined': registration_date if registration_date else make_aware(parse('2024-01-01')),
                    }

                    customer, created = User.objects.update_or_create(
                        document_number=dni,
                        document_type=User.DocumentType.V, # Asumimos Venezolano por defecto en esta importación
                        defaults=customer_data
                    )
                    
                    successful_imports += 1
                    if created:
                        self.stdout.write(self.style.SUCCESS(f'CREATED: {customer}'))
                    else:
                        self.stdout.write(f'UPDATED: {customer}')

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error on row {i}: {e}'))
                    skipped_rows += 1

        self.stdout.write(self.style.SUCCESS(f'Import complete. Imported: {successful_imports}, Skipped: {skipped_rows}'))

    def create_dummy_csv(self):
        dir_path = os.path.join(settings.BASE_DIR, 'data_imports', 'raw')
        os.makedirs(dir_path, exist_ok=True)
        csv_path = os.path.join(dir_path, 'Ficha de clientes.csv')
        
        if os.path.exists(csv_path):
            return # Don't overwrite if it exists

        self.stdout.write(self.style.WARNING("Creating a dummy 'Ficha de clientes.csv' for demonstration."))
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Marca temporal', 'Nombre', 'Apellido', 'Cédula de Identidad ', 'Número de Teléfono Principal', 'Número de Teléfono del Contacto de Emergencia ', 'Nombre Completo del Contacto de Emergencia', 'Dirección de Residencia Completa', '¿Tiene alguna lesión, condición médica o alergia que debamos conocer?', "Si respondió 'Sí' en la pregunta anterior, por favor especifique."])
            writer.writerow(['2/23/2024 18:25:21', 'Mafer', 'Mayorca', '99999999', '4141112233', '4123334455', 'Ana Mayorca', 'Urb. Las Acacias', 'Sí', 'Asma'])
            writer.writerow(['2/24/2024 10:10:10', 'Pedro', 'Perez', '88888888', '4249876543', '', '', 'Urb. Las Mercedes', 'No', ''])
        
        return csv_path
