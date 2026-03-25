import axios from 'axios';

// Configuración estándar para la protección CSRF de Django con Axios
// https://axios-http.com/docs/csrftoken
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true, // Esencial para enviar la cookie de sesión
});

// Exporta el type guard de Axios para usarlo en tus componentes
export const { isAxiosError } = axios;
