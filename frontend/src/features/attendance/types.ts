// src/features/attendance/types.ts
import { User } from '../../types/user';

export interface MatchedUser {
    user_id: number;
    detected_name: string;
    matched_name: string;
    confidence: number;
}

export interface OCRResponse {
    success: boolean;
    matched_users: MatchedUser[];
    unmatched_text: string[];
    error?: string;
}

export interface Attendance {
  id: number;
  user: number; // ID del usuario
  user_details: string; // Nombre del usuario para mostrar rápido
  timestamp: string;
  entry_method: 'MANUAL' | 'WHATSAPP' | 'QR';
  ocr_raw_text: string | null;
}