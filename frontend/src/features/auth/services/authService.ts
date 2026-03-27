import { apiClient } from '../../../api/client';
import type { User } from '../../../types/user';

export interface LoginCredentials {
  username?: string;
  password?: string;
}

/**
 * Inicia sesión en el backend.
 * @param credentials - Objeto con username y password.
 * @returns Una promesa que se resuelve con los datos del usuario.
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await apiClient.post<User>('login/', credentials);
  return response.data;
};

/**
 * Cierra la sesión en el backend.
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('logout/');
};

/**
 * Verifica la sesión actual con el backend para obtener los datos del usuario.
 */
export const checkSession = async (): Promise<User> => {
  const response = await apiClient.get<User>('session/');
  return response.data;
};
