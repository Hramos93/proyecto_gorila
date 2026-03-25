import React from 'react';
import { WhatsAppUploader } from '../attendance/components/WhatsAppUploader';
import { AttendanceDashboard } from '../attendance/components/AttendanceDashboard';

export const Dashboard = () => {
  return (
    <main className="max-w-screen-2xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* Columna Izquierda: Uploader (ocupa 2/3 en pantallas grandes) */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Portal de Carga OCR</h2>
            <p className="text-gray-400 mt-1">
              Sube la captura de WhatsApp para registrar asistencias masivas.
            </p>
          </div>
          <WhatsAppUploader />
        </div>

        {/* Columna Derecha: Dashboard (ocupa 1/3 en pantallas grandes) */}
        <div className="lg:col-span-1">
          <AttendanceDashboard />
        </div>
      </div>
    </main>
  );
};
