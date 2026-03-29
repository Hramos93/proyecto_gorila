// src/api/client.ts
import axios from 'axios';
import toast from 'react-hot-toast';

export const apiClient = axios.create({
  // 1. Unificamos el dominio. Usa 'localhost' en lugar de '127.0.0.1'
  baseURL: 'http://localhost:8000/api/v1', 
  withCredentials: true, // Permite el envío de cookies
  
  // 2. MAGIA DE DJANGO: Le decimos a Axios que busque la cookie CSRF 
  // y la inyecte automáticamente en los encabezados de cada petición.
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    
    if (status === 401) {
      toast.error('Sesión expirada o no iniciada.');
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error('Acceso denegado (403). Permisos insuficientes.');
    } else if (status >= 500) {
      toast.error('Error interno del servidor (Django).');
    }
    
    return Promise.reject(error);
  }
);