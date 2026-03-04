import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // O tu URL base
  // ... otras configuraciones
});

// Exporta el type guard de Axios para usarlo en tus componentes
export const { isAxiosError } = axios;
