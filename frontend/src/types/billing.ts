// src/types/billing.ts

export interface Plan {
    id: number;
    codPlan: string;
    name: string;
    price: string; 
    duration_days: number;
    class_limit: number;
    is_active: boolean;
}

export interface Currency {
    id: number;
    code: string;
    symbol: string;
    is_base: boolean;
}

export interface ExchangeRate {
    id: number;
    currency: number;
    currency_code?: string;
    rate: string;
    effective_date: string;
}

export interface PaymentTransaction {
    id: number;
    invoice: number;
    // Añadimos 'CHANGE' para el registro de vueltos
    method: 'CASH' | 'PAGO_MOVIL' | 'ZELLE' | 'POS' | 'TRANSFER' | 'CHANGE'; 
    currency: number;
    currency_code?: string;
    amount_paid: string;
    exchange_rate_payment: string;
    equivalent_usd: string;
    payment_date: string;
    reference?: string | null;
    receipt_image?: string | null;
}

export interface Invoice {
    id: number;
    user: number;
    user_name?: string;
    plan: number;
    plan_name?: string;
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
    emission_date: string;
    exchange_rate_emission: string;
    amount_usd: string;
    amount_ves: string;
    payments: PaymentTransaction[];
}

export interface CheckoutPayload {
    user: number;
    plan: number;
    amount_usd: number;
    amount_ves: number;
    exchange_rate_emission: number;
    payments: {
        method: string;
        currency: number;
        amount_paid: number;
        exchange_rate_payment: number;
        reference?: string;
    }[];
}