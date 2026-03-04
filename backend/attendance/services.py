# backend/attendance/services.py

import cv2
import numpy as np
import pytesseract
import re
import os  # <-- NUEVO: Importamos os para manejar variables de entorno
from fuzzywuzzy import process, fuzz
from django.core.files.uploadedfile import InMemoryUploadedFile
from users.models import User

# 1. Ruta al programa ejecutable
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# 2. NUEVO: Le decimos a Tesseract exactamente dónde están los idiomas
os.environ['TESSDATA_PREFIX'] = r'C:\Program Files\Tesseract-OCR\tessdata\tessdata'


class WhatsAppOCRService:
    """
    Servicio de visión computacional para extraer listas de asistencia de WhatsApp.
    Optimizado para Dark Mode y listas enumeradas.
    """

    def __init__(self, image_file: InMemoryUploadedFile):
        self.image_file = image_file
        self.processed_img = None
        self.extracted_text = []
        self.matched_users = []
        self.unmatched_lines = []

    def _preprocess_image(self):
        """
        Paso 1: Escalar, Invertir colores (Dark Mode a Light Mode) y binarizar.
        """
        file_bytes = np.asarray(bytearray(self.image_file.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        # MAGIA NUEVA: Escalar la imagen al doble (x2)
        # Esto es vital para que Tesseract no confunda números con letras (8 vs B, 4 vs A)
        img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        _, self.processed_img = cv2.threshold(
            gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

    def _extract_and_clean_text(self):
        """
        Paso 2: Leer el texto con Tesseract y aplicar Regex avanzada.
        """
        custom_config = r'--oem 3 --psm 6' 
        raw_text = pytesseract.image_to_string(self.processed_img, config=custom_config, lang='spa')
        
        lines = raw_text.split('\n')
        cleaned_names = []

        for line in lines:
            line = line.strip()

            if len(line) < 3:
                continue

            lower_line = line.lower()

            # 1. Ignorar cabeceras típicas
            if any(word in lower_line for word in ['asistencia', 'buenos días', 'entrenadora', 'hoy', 'buenas tardes']):
                continue
            
            # 2. Eliminar marcas de tiempo sueltas o pegadas al final (Ej: "10:03 a.m." o "vdalmy 1003a.m")
            # Busca y corta cualquier cosa que parezca una hora al final de la línea
            line = re.sub(r'\s*\d{1,4}\s*:?\s*\d{0,2}\s*[ap]\.?\s*m\.?$', '', line, flags=re.IGNORECASE)

            if line.startswith('*'):
                continue

            # 3. SUPER REGEX: Limpiar prefijos numéricos Y letras confundidas 
            # (Convierte "1-Mafer", "A-Gabriela", "B-Elimar" -> "Mafer", "Gabriela", "Elimar")
            # Busca de 1 a 2 caracteres (letras o números) seguidos de guion, punto o paréntesis
            line = re.sub(r'^[\w\d]{1,2}[\-\.\)]\s*', '', line)

            # 4. Limpiar notas inline (Convierte "Junior *pago móvil..." -> "Junior")
            line = re.split(r'[\*\(]', line)[0].strip()

            # 5. Limpieza final de espacios o caracteres basura residuales al inicio
            line = re.sub(r'^[^a-zA-Z]+', '', line)

            if len(line) >= 3:
                cleaned_names.append(line.capitalize()) # Capitalize para que quede bonito ("Mafer")

        self.extracted_text = cleaned_names

    def _match_with_database(self):
        """
        Paso 3: Fuzzy Matching. Cruza los nombres limpios con la BD.
        """
        # Traemos solo los clientes activos
        active_clients = User.objects.filter(role='CLIENT', is_active=True)
        
        if not active_clients.exists():
            self.unmatched_lines = self.extracted_text
            return

        # Creamos un diccionario {1: "Barbara Perez", 2: "Emileth Gomez"}
        client_dict = {user.id: f"{user.first_name} {user.last_name}" for user in active_clients}
        client_names = list(client_dict.values())

        for name in self.extracted_text:
            # token_set_ratio es ideal aquí. Si el OCR lee "Junior" y en la BD está "Junior Ramirez",
            # el token_set_ratio dará un puntaje altísimo (casi 100%).
            match = process.extractOne(name, client_names, scorer=fuzz.token_set_ratio)
            
            # Si la coincidencia es mayor al 75%, lo damos por válido
            if match and match[1] >= 75:
                matched_id = next(uid for uid, c_name in client_dict.items() if c_name == match[0])
                self.matched_users.append({
                    "user_id": matched_id,
                    "detected_name": name, # Lo que leyó el OCR (ej. "Mafer")
                    "matched_name": match[0], # El nombre real en BD (ej. "Maria Fernanda")
                    "confidence": match[1]
                })
            else:
                # Nombres como "Nueva1" o "Nueva2" caerán aquí para ser revisados manualmente
                self.unmatched_lines.append(name)

    def process(self):
        """Ejecuta el pipeline completo."""
        self._preprocess_image()
        self._extract_and_clean_text()
        self._match_with_database()
        
        return {
            "success": True,
            "matched_users": self.matched_users,
            "unmatched_text": self.unmatched_lines
        }