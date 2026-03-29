// src/features/customers/services/customerService.ts
import { apiClient } from '../../../api/client';
import { User } from '../../../types/user';

export const getCustomers = async (): Promise<User[]> => {
  try {
    // IMPORTANTE: Asegúrate de que este endpoint sea el correcto en tu Django.
    // Si tu baseURL es 'http://127.0.0.1:8000/api/v1', esto llamará a 'http://127.0.0.1:8000/api/v1/customers/'
    const response = await apiClient.get<any>('/customers/');
    
    // DRF devuelve paginación con "results". Si no hay paginación, devuelve el array directo.
    const data = response.data.results || response.data;
    
    if (!Array.isArray(data)) {
        console.warn('La API no devolvió un arreglo de clientes:', data);
        return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    // En lugar de devolver [], relanzamos el error para que el componente (UI) lo maneje.
    throw error; 
  }
};