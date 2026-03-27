import csv
import os
import re
from django.core.management.base import BaseCommand
from django.conf import settings
from users.models import User
from django.db import IntegrityError

class Command(BaseCommand):
    help = 'Import customers from the definitive CSV file into the User model.'

    def handle(self, *args, **options):
        # Correct path to the CSV file inside the backend directory.
        # BASE_DIR already points to the 'backend' folder.
        csv_file_path = os.path.join(settings.BASE_DIR, 'data_imports', 'raw', 'Ficha de clientes.csv')

        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'File not found at: {csv_file_path}'))
            return

        self.stdout.write(self.style.SUCCESS(f'Starting customer import from: {csv_file_path}'))

        created_count = 0
        updated_count = 0
        skipped_count = 0

        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Clean headers and values from potential whitespace issues
                cleaned_row = {k.strip(): v.strip() for k, v in row.items()}
                
                doc_full = cleaned_row.get('Cédula de Identidad', '').strip()
                if not doc_full:
                    self.stdout.write(self.style.WARNING('Skipping row: DNI is missing.'))
                    skipped_count += 1
                    continue
                
                # Separate document type from number (e.g., 'V12345678' -> 'V', '12345678')
                doc_type_match = re.match(r'^([A-Z])', doc_full)
                doc_type = doc_type_match.group(1) if doc_type_match else 'V'
                doc_number = re.sub(r'^[A-Z]', '', doc_full)

                # Prepare user data from CSV, providing defaults for optional fields
                user_data = {
                    'first_name': cleaned_row.get('Nombre', '').capitalize(),
                    'last_name': cleaned_row.get('Apellido', '').capitalize(),
                    'phone': cleaned_row.get('Número de Teléfono Principal') or None,
                    'emergency_contact_name': cleaned_row.get('Nombre Completo del Contacto de Emergencia') or None,
                    'emergency_phone': cleaned_row.get('Número de Teléfono del Contacto de Emergencia') or None,
                    'address': cleaned_row.get('Dirección de Residencia Completa') or None,
                    'has_injuries': cleaned_row.get('¿Tiene alguna lesión, condición médica o alergia que debamos conocer?', 'No').lower().startswith('s'),
                    'injury_details': cleaned_row.get("Si respondió 'Sí' en la pregunta anterior, por favor especifique.") or None,
                    'role': User.Role.CLIENT, # Ensure they are marked as clients
                }
                
                # Generate a unique username, required by Django's User model
                user_data['username'] = f"user_{doc_type.lower()}{doc_number}"

                try:
                    user, created = User.objects.update_or_create(
                        document_number=doc_number,
                        defaults={**user_data, 'document_type': doc_type} # Pass doc_type here for creation
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(self.style.SUCCESS(f'CREATED: {user.get_full_name()} ({doc_type}{doc_number})'))
                    else:
                        updated_count += 1
                        self.stdout.write(f'UPDATED: {user.get_full_name()} ({doc_type}{doc_number})')

                except IntegrityError as e:
                    self.stdout.write(self.style.ERROR(f'SKIPPED (Integrity Error): Row for DNI {doc_full}. A user with a similar username might already exist. Error: {e}'))
                    skipped_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'SKIPPED (Error): Row for DNI {doc_full}: {e}'))
                    skipped_count += 1


        self.stdout.write(self.style.SUCCESS(f'\nImport complete. Created: {created_count}, Updated: {updated_count}, Skipped: {skipped_count}'))
