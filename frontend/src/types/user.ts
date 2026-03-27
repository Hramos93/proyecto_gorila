// Define la estructura de un usuario, coincidiendo con el UserBasicSerializer del backend.
export interface User {
  id: number;
  internal_code: string | null;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  role: 'CLIENT' | 'COACH' | 'WORKER';
  payment_status: 'PAID' | 'PENDING' | 'OVERDUE';
  avatar_url?: string;
}