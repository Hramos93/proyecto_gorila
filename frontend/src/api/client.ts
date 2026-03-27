import axios from 'axios';

// Asume que tu backend de Django corre en el puerto 8000.
// Ajusta esta URL si tu configuración es diferente.
const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ESENCIAL para la autenticación de sesiones con Django
  xsrfCookieName: 'csrftoken',   // Nombre de la cookie de seguridad que usa Django
  xsrfHeaderName: 'X-CSRFToken', // Nombre del header donde Django la espera de vuelta
  // Aquí podrías añadir headers, como el de autorización si usas tokens JWT.
  // headers: { 'Content-Type': 'application/json' }
});