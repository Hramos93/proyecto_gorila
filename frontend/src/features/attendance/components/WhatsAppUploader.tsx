// frontend/src/features/attendance/components/WhatsAppUploader.tsx

import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { isAxiosError } from 'axios'; // <-- CORRECCIÓN: Importar directo de axios
import { apiClient } from '../../../api/client';
// Usamos "import type" para que Vite no busque código JS donde solo hay interfaces
import type { OCRResponse } from '../types';


export const WhatsAppUploader = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejadores de eventos de arrastrar y soltar
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // La función que se comunica con Django
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor sube solo archivos de imagen (PNG, JPG).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    // Creamos un FormData idéntico a lo que hacíamos en Postman
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiClient.post<OCRResponse>('/attendance/records/upload-whatsapp/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        // Error conocido del backend (ej. 400, 500)
        setError(err.response.data?.error || 'El servidor devolvió un error inesperado.');
      } else {
        // Error de red o un problema no relacionado con Axios
        setError('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
        console.error("Error no esperado:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors duration-200 ease-in-out cursor-pointer
          ${isDragging ? 'border-brand-neon bg-brand-neon/10' : 'border-brand-gray hover:border-brand-neon/50 bg-brand-dark'}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileSelect} 
        />

        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-brand-neon animate-spin" />
            <p className="text-gray-300 font-medium">Procesando con IA (OCR)...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-brand-gray rounded-full">
              <UploadCloud className="w-10 h-10 text-brand-neon" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                Arrastra la captura de WhatsApp aquí
              </p>
              <p className="text-sm text-gray-400 mt-2">
                o haz clic para seleccionar la imagen
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mostrar Errores */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Mostrar Resultados de Django */}
      {result && (
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-bold text-white border-b border-brand-gray pb-2">Resultados del Escaneo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clientes Encontrados */}
            <div className="bg-brand-gray p-4 rounded-lg border border-green-500/30">
              <h4 className="text-green-400 font-semibold mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" /> 
                Clientes Reconocidos ({result.matched_users.length})
              </h4>
              <ul className="space-y-2">
                {result.matched_users.map((user, idx) => (
                  <li key={idx} className="text-sm text-gray-200 flex justify-between bg-black/20 p-2 rounded">
                    <span>{user.matched_name}</span>
                    <span className="text-green-500 text-xs">{user.confidence}% coincidencia</span>
                  </li>
                ))}
                {result.matched_users.length === 0 && (
                  <li className="text-sm text-gray-500 italic">No se encontraron coincidencias exactas.</li>
                )}
              </ul>
            </div>

            {/* No Reconocidos */}
            <div className="bg-brand-gray p-4 rounded-lg border border-yellow-500/30">
              <h4 className="text-yellow-400 font-semibold mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> 
                No Reconocidos ({result.unmatched_text.length})
              </h4>
              <ul className="space-y-2">
                {result.unmatched_text.map((text, idx) => (
                  <li key={idx} className="text-sm text-gray-200 bg-black/20 p-2 rounded">
                    {text}
                  </li>
                ))}
                {result.unmatched_text.length === 0 && (
                  <li className="text-sm text-gray-500 italic">Todos fueron reconocidos.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};