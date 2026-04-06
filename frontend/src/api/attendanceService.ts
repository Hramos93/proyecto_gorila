// src/api/attendanceService.ts
import { apiClient } from './client';

export const attendanceService = {
    // Buscar Clases
    getClasses: async () => {
        const response = await apiClient.get('/classes/'); 
        return response.data;
    },

    // Buscar Entrenadores
    getTrainers: async () => {
        const response = await apiClient.get('/attendances/trainers/');
        return response.data;
    },

    // Check-in Manual
    registerManualCheckin: async (userId: number, trainerId?: string, classId?: string) => {
        const response = await apiClient.post('/attendances/manual-checkin/', {
            user_id: userId,
            trainer_id: trainerId ? Number(trainerId) : null,
            class_id: classId ? Number(classId) : null
        });
        return response.data;
    },

    // --- NUEVAS FUNCIONES PARA OCR (WHATSAPP) ---

    // Subir imagen para análisis OCR
    uploadWhatsAppImage: async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await apiClient.post('/attendances/upload-whatsapp/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

// Confirmar múltiples asistencias (AHORA CON TRAZABILIDAD)
    bulkConfirm: async (userIds: number[], attendanceDate: string, trainerId: string, classId: string) => {
        const response = await apiClient.post('/attendances/bulk-confirm/', {
            user_ids: userIds,
            entry_method: 'WHATSAPP',
            attendance_date: attendanceDate,
            trainer_id: Number(trainerId), // ¡Sin esto, Django da error 400!
            class_id: Number(classId)      // ¡Sin esto, Django da error 400!
        });
        return response.data;
    }
};