// src/types/user.ts

export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';
export type DocumentType = 'V' | 'E' | 'P';
export type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT';

export interface User {
  id: number;
  internal_code: string | null;
  first_name: string;
  last_name: string;
  full_name?: string; // Algunos endpoints devuelven el nombre unido
  document_type: DocumentType;
  document_number: string;
  dni?: string; // Alias común para document_number en algunos componentes
  role: UserRole;
  avatar_url?: string | null;
  phone?: string | null;
  is_active: boolean;
  payment_status: PaymentStatus;
  last_attendance_date?: string | null;
}