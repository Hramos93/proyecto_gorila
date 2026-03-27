import { apiClient } from '../../../api/client';
import { User } from '../../../types/user';

/**
 * Obtiene la lista completa de clientes desde el backend.
 * @returns Una promesa que se resuelve con un array de clientes.
 */
export const getCustomers = async (): Promise<User[]> => {
  try {
    const response = await apiClient.get<User[]>('/customers/');
    return response.data;
  } catch (error) {
    console.error("Error al obtener la lista de clientes:", error);
    throw error;
  }
};