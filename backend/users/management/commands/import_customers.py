# backend/users/management/commands/import_customers.py

import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from users.models import User

class Command(BaseCommand):
    help = 'Importa clientes desde el archivo Ficha de clientes.csv'

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO("--- EJECUTANDO VERSIÓN BLINDADA (PASO 9) ---"))

        file_path = os.path.join(settings.BASE_DIR, 'data_imports', 'raw', 'Ficha de clientes.csv')
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'Archivo no encontrado en: {file_path}'))
            return

        # MEJORA: Abrimos con 'utf-8-sig' para ignorar el BOM (caracteres invisibles al inicio)
        with open(file_path, mode='r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # MEJORA: Limpiamos los nombres de las columnas (quitamos espacios al inicio/final)
            reader.fieldnames = [name.strip() for name in reader.fieldnames]
            
            count = 0
            skipped = 0

            for row in reader:
                # Obtenemos el nombre para el log de errores
                nombre_cliente = row.get('Nombre', 'Desconocido').strip()
                
                try:
                    # 1. Procesamiento de DNI con nombres de columna normalizados
                    # Usamos .get() para evitar el KeyError si hay variaciones en el nombre
                    raw_dni = row.get('Cédula de Identidad', '').strip().upper()
                    
                    if not raw_dni:
                        self.stdout.write(self.style.WARNING(f"Fila sin cédula para {nombre_cliente}, saltando..."))
                        continue

                    doc_type = raw_dni[0] if raw_dni[0] in ['V', 'E', 'J', 'P'] else 'V'
                    doc_number = raw_dni[1:] if raw_dni[0] in ['V', 'E', 'J', 'P'] else raw_dni

                    # 2. Información Médica
                    has_condition = row.get('¿Tiene alguna lesión, condición médica o alergia que debamos conocer?', 'No')
                    condition_detail = row.get("Si respondió 'Sí' en la pregunta anterior, por favor especifique.", "")
                    medical_info = f"SÍ: {condition_detail}" if has_condition == 'Sí' else "Ninguna"

                    # 3. Guardado en la Base de Datos
                    user, created = User.objects.get_or_create(
                        document_number=doc_number,
                        defaults={
                            'username': doc_number,
                            'first_name': nombre_cliente.capitalize(),
                            'last_name': row.get('Apellido', '').strip().capitalize(),
                            'document_type': doc_type,
                            'phone_number': str(row.get('Número de Teléfono Principal', '')), 
                            'address': row.get('Dirección de Residencia Completa', ''),
                            'emergency_contact_name': row.get('Nombre Completo del Contacto de Emergencia', ''),
                            'emergency_contact_phone': str(row.get('Número de Teléfono del Contacto de Emergencia', '')), 
                            'medical_conditions': medical_info, 
                            'role': User.Role.CLIENT,
                            'is_active': True
                        }
                    )

                    if created:
                        user.set_password(doc_number)
                        user.save() # Esto genera el código C000X
                        count += 1
                        self.stdout.write(f"EXITO: {user.first_name} registrado como {user.internal_code}")
                    else:
                        skipped += 1

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"ERROR en cliente {nombre_cliente}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f'\n--- PROCESO FINALIZADO ---'))
        self.stdout.write(self.style.SUCCESS(f'Clientes nuevos: {count}'))
        self.stdout.write(self.style.SUCCESS(f'Clientes que ya existían: {skipped}'))