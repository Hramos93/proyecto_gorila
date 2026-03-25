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

export interface User {
  id: number;
  internal_code: string | null;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  role: string;
}

export interface Attendance {
  id: number;
  user: number;
  user_details: string;
  timestamp: string;
  entry_method: 'MANUAL' | 'WHATSAPP' | 'QR';
  ocr_raw_text: string | null;
}