// src/features/customer/types.ts
import { User } from '../../types/user';

// Para las tarjetas del tablero Kanban (información reducida)
export interface CustomerCard {
    id: number;
    full_name: string;
    membership_end_date: string | null;
}

// Estructura del tablero que viene del backend
export interface CustomerBoard {
    active: CustomerCard[];
    due: CustomerCard[];
    expired: CustomerCard[];
    never_active: CustomerCard[];
}

// Para el historial de asistencia en el detalle del cliente
export interface AttendanceRecord {
    id: number;
    user_details: string;
    timestamp: string;
    entry_method: 'MANUAL' | 'WHATSAPP' | 'BIOMETRIC';
}