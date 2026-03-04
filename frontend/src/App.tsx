// frontend/src/App.tsx

import React from 'react';
import { WhatsAppUploader } from './features/attendance/components/WhatsAppUploader';
import { Dumbbell } from 'lucide-react'; // Un ícono representativo para Energy Box

function App() {
  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-neon selection:text-black">
      {/* Navbar Superior (Mock) */}
      <header className="border-b border-brand-gray bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Dumbbell className="text-brand-neon w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tighter">
              ENERGY<span className="text-brand-neon">BOX</span> CRM
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            Módulo de Asistencia
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Registro Inteligente</h2>
          <p className="text-gray-400 mt-2">
            Sube la captura de WhatsApp y el sistema registrará la asistencia automáticamente usando OCR.
          </p>
        </div>

        {/* Instanciamos nuestro componente mágico */}
        <WhatsAppUploader />
      </main>
    </div>
  );
}

export default App;