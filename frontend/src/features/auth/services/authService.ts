// src/features/auth/services/authService.ts
import { apiClient } from '../../../api/client';
import type { User } from '../../../types/user';

// TYPE SAFETY: username y password ahora son estrictamente obligatorios (eliminamos el '?')
export interface LoginCredentials {
  username: string;
  password: string;
}

// Interfaz para la respuesta que armamos en nuestro CustomTokenObtainPairSerializer
interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export const login = async (credentials: LoginCredentials): Promise<User> => {
  // Ahora apuntamos a la ruta JWT que definimos en Django
  const response = await apiClient.post<LoginResponse>('login/', credentials);
  
  // Guardamos los tokens criptográficos en el navegador
  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);
  
  return response.data.user;
};

export const logout = async (): Promise<void> => {
  // Al ser JWT una arquitectura stateless, para cerrar sesión 
  // simplemente destruimos las "llaves" del lado del cliente.
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const checkSession = async (): Promise<User> => {
  // Si no hay token guardado, ni siquiera intentamos llamar al backend
  if (!localStorage.getItem('access_token')) {
    throw new Error("No hay sesión activa localmente.");
  }
  
  // Como borramos la ruta '/session/' en Django, usamos la acción '@action me'
  // de tu UserViewSet para pedir los datos del usuario logueado.
  const response = await apiClient.get<User>('users/me/');
  return response.data;
};