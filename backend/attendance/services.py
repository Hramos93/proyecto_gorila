# backend/attendance/services.py
import cv2
import numpy as np
import pytesseract
import re
import os
# REEMPLAZO: Usamos rapidfuzz en lugar de fuzzywuzzy
from rapidfuzz import process, fuzz 
from django.core.files.uploadedfile import InMemoryUploadedFile
from users.models import User
from django.conf import settings

# --- Configuración de Tesseract ---
# MEJORA: Priorizamos la variable de entorno. Esto es vital para el despliegue en Azure.
tesseract_path = os.getenv('TESSERACT_CMD', r'C:\Program Files\Tesseract-OCR\tesseract.exe')
pytesseract.pytesseract.tesseract_cmd = tesseract_path

class WhatsAppOCRService:
    """
    Servicio de visión computacional optimizado para Energy Box.
    Extrae listas de asistencia de WhatsApp y las cruza con la base de datos.
    """

    def __init__(self, image_file: InMemoryUploadedFile):
        self.image_file = image_file
        self.processed_img = None
        self.extracted_text = []
        self.matched_users = []
        self.unmatched_lines = []

    def _preprocess_image(self):
        """
        Paso 1: Preparación de la imagen (Escalado y Binarización).
        """
        file_bytes = np.asarray(bytearray(self.image_file.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        # MEJORA: Redimensionamiento inteligente para mejorar la lectura de fuentes pequeñas.
        img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Aplicamos un filtro para eliminar ruido antes de la binarización.
        _, self.processed_img = cv2.threshold(
            gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

    def _extract_and_clean_text(self):
        """
        Paso 2: Extracción con Tesseract y limpieza profunda con Regex.
        """
        custom_config = r'--oem 3 --psm 6' 
        raw_text = pytesseract.image_to_string(self.processed_img, config=custom_config, lang='spa')
        
        lines = raw_text.split('\n')
        cleaned_names = []

        for line in lines:
            line = line.strip()
            if len(line) < 3: continue

            # MEJORA: Limpieza de basura típica de WhatsApp (horas, estados, numeración).
            # Elimina horas como "10:30 am" o "4:15pm"
            line = re.sub(r'\s*\d{1,2}\s*:?\s*\d{0,2}\s*[ap]\.?\s*m\.?$', '', line, flags=re.IGNORECASE)
            # Elimina prefijos como "1-", "2.", "A)"
            line = re.sub(r'^[\w\d]{1,2}[\-\.\)]\s*', '', line)
            # Corta la línea si hay un asterisco (notas de pago)
            line = re.split(r'[\*\(]', line)[0].strip()
            # Elimina cualquier caracter no alfabético al inicio
            line = re.sub(r'^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+', '', line)

            if len(line) >= 3:
                cleaned_names.append(line)

        self.extracted_text = cleaned_names

    def _match_with_database(self):
        """
        Versión optimizada con RapidFuzz para Energy Box.
        """
        active_clients = User.objects.filter(role='CLIENT', is_active=True)
        
        # Mapeo para búsqueda rápida
        client_dict = {user.id: user.search_name for user in active_clients}
        client_display_names = {user.id: f"{user.first_name} {user.last_name}" for user in active_clients}
        search_choices = list(client_dict.values())

        for detected_text in self.extracted_text:
            normalized_detected = detected_text.lower().replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
            
            # RapidFuzz usa una API casi idéntica
            match = process.extractOne(
                normalized_detected, 
                search_choices, 
                scorer=fuzz.token_set_ratio
            )
            
            # El objeto match en rapidfuzz es (string, score, index)
            if match and match[1] >= 75:
                matched_name_in_db = match[0]
                user_id = next(uid for uid, s_name in client_dict.items() if s_name == matched_name_in_db)
                
                self.matched_users.append({
                    "user_id": user_id,
                    "detected_name": detected_text, 
                    "matched_name": client_display_names[user_id], 
                    "confidence": round(match[1], 2)
                })
            else:
                self.unmatched_lines.append(detected_text)

    def process(self):
        """Ejecuta el pipeline completo de visión computacional."""
        self._preprocess_image()
        self._extract_and_clean_text()
        self._match_with_database()
        
        return {
            "success": True,
            "matched_users": self.matched_users,
            "unmatched_text": self.unmatched_lines
        }