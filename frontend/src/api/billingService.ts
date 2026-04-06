// src/api/billingService.ts
import { apiClient } from './client';
import type { Plan, Currency, ExchangeRate, Invoice, PaymentTransaction } from '../types/billing';

export interface PaymentPayload {
    method: string;
    currency: number;
    amount_paid: number;
    exchange_rate_payment: number;
    reference?: string;
}

export const billingService = {
    // --- PLANES ---
    getPlans: async () => {
        const response = await apiClient.get<Plan[]>('/payments/plans/');
        return response.data;
    },
    
    createPlan: async (data: Omit<Plan, 'id'>) => {
        const response = await apiClient.post<Plan>('/payments/plans/', data);
        return response.data;
    },

    // --- MONEDAS Y TASAS ---
    getCurrencies: async () => {
        const response = await apiClient.get<Currency[]>('/payments/currencies/');
        return response.data;
    },

    getLatestExchangeRate: async () => {
        const response = await apiClient.get<ExchangeRate[]>('/payments/exchange-rates/');
        // Django devuelve la lista ordenada por fecha, el [0] es la tasa oficial de hoy
        return response.data.length > 0 ? response.data[0] : null; 
    },

    // --- FACTURACIÓN (NUEVA LÓGICA DE PAGOS MIXTOS) ---
    processCheckout: async (
        userId: number, 
        planId: number, 
        amountUsd: number, 
        amountVes: number, 
        rate: number, 
        payments: PaymentPayload[]
    ) => {
        // 1. Emitir la Factura (Nace en estatus PENDING)
        const invoiceRes = await apiClient.post<Invoice>('/payments/invoices/', {
            user: userId,
            plan: planId,
            amount_usd: amountUsd,
            amount_ves: amountVes,
            exchange_rate_emission: rate
        });

        const invoiceId = invoiceRes.data.id;

        // 2. Disparar todos los pagos asociados a esa factura (Efectivo, Zelle, Bs...)
        const paymentPromises = payments.map(p => 
            apiClient.post<PaymentTransaction>('/payments/transactions/', {
                invoice: invoiceId,
                method: p.method,
                currency: p.currency,
                amount_paid: p.amount_paid,
                exchange_rate_payment: p.exchange_rate_payment,
                reference: p.reference
            })
        );

        // Esperamos a que todos los pagos se registren
        await Promise.all(paymentPromises);

        // Al completarse, el backend evaluará si la suma cubre el total
        // y sumará automáticamente las clases al cliente.
        return invoiceRes.data;
    }
};