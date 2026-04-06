// src/api/client.ts
import axios from 'axios';
import toast from 'react-hot-toast';

export const apiClient = axios.create({
  // URL base apuntando a nuestro Django local
  baseURL: 'http://localhost:8000/api/v1',
  // ¡ELIMINADO!: withCredentials y las variables CSRF ya no son necesarias para JWT.
});

// NUEVO: Interceptor de Peticiones (Request)
apiClient.interceptors.request.use((config) => {
  // Buscamos el token en el almacenamiento local del navegador
  const token = localStorage.getItem('access_token');
  if (token) {
    // Si existe, lo adjuntamos al encabezado de autorización
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ACTUALIZADO: Interceptor de Respuestas (Response)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      // Si el backend dice 401, el token expiró o es inválido.
      // Limpiamos los rastros y forzamos el login.
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Evitamos mostrar el toast si ya estamos en la página de login
      if (window.location.pathname !== '/login') {
        toast.error('Tu sesión ha expirado.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('Acceso denegado. Permisos insuficientes.');
    } else if (status >= 500) {
      toast.error('Error interno del servidor (Django).');
    }
    
    return Promise.reject(error);
  }
);