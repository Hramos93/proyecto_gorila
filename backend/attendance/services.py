import cv2
import numpy as np
import pytesseract
import re
from fuzzywuzzy import process, fuzz
from django.core.files.uploadedfile import InMemoryUploadedFile
from users.models import User

# --- AGREGA ESTA LÍNEA PARA WINDOWS ---
# Cambia la ruta si lo instalaste en otra carpeta
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

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
        Paso 1: Invertir colores (Dark Mode a Light Mode) y binarizar.
        """
        # Convertir archivo en memoria a formato matricial de OpenCV
        file_bytes = np.asarray(bytearray(self.image_file.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        # Convertir a escala de grises
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # MAGIA DE OPENCV: Como es Dark Mode (texto blanco/fondo oscuro), 
        # usamos THRESH_BINARY_INV + OTSU. Esto detecta automáticamente el nivel 
        # de oscuridad y convierte el fondo a blanco y el texto a negro.
        _, self.processed_img = cv2.threshold(
            gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

    def _extract_and_clean_text(self):
        """
        Paso 2: Leer el texto con Tesseract y aplicar limpieza Regex basada en los patrones de Energy Box.
        """
        # oem 3 = Default OCR engine, psm 6 = Asumir un solo bloque de texto uniforme
        custom_config = r'--oem 3 --psm 6' 
        raw_text = pytesseract.image_to_string(self.processed_img, config=custom_config, lang='spa')
        
        lines = raw_text.split('\n')
        cleaned_names = []

        for line in lines:
            line = line.strip()

            # 1. Ignorar líneas vacías o muy cortas (ruido de la imagen)
            if len(line) < 3:
                continue

            lower_line = line.lower()

            # 2. Ignorar cabeceras y timestamps de WhatsApp
            if any(word in lower_line for word in ['asistencia', 'buenos días', 'entrenadora', 'hoy']):
                continue
            # Regex para detectar "10:03 a. m." o "9:45 p. m."
            if re.match(r'^\d{1,2}:\d{2}\s*(a\.?\s*m\.?|p\.?\s*m\.?)$', lower_line):
                continue
            
            # 3. Ignorar notas de pie de página (ej. "*Las nuevas pagarán...")
            if line.startswith('*'):
                continue

            # 4. Limpiar prefijos numéricos (Convierte "1-Mafer" o "2. Nidia" -> "Mafer", "Nidia")
            # Busca dígitos al inicio, seguidos de guion, punto o paréntesis y un espacio opcional
            line = re.sub(r'^\d+[\-\.\)]\s*', '', line)

            # 5. Limpiar notas inline (Convierte "Junior *pago móvil..." -> "Junior")
            # Corta el string exactamente donde encuentre un asterisco o un paréntesis
            line = re.split(r'[\*\(]', line)[0].strip()

            if len(line) >= 3:
                cleaned_names.append(line)

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