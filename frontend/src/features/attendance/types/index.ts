export interface MatchedUser {
    user_id: number;
    detected_name: string;
    matched_name: string;
    confidence: number;
}

export interface OCRResponse {
    success: boolean;        // Agregamos esto
    matched_users: MatchedUser[];
    unmatched_text: string[];
    error?: string;          // Agregamos esto
}