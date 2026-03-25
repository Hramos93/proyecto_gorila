import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, Check, X } from 'lucide-react';
import { isAxiosError } from 'axios';
import { apiClient } from '../../../api/client';
import type { OCRResponse, MatchedUser } from '../types';
import { UnmatchedRow } from './UnmatchedRow';

export const WhatsAppUploader = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const resetState = () => {
    setIsDragging(false);
    setIsLoading(false);
    setIsConfirming(false);
    setResult(null);
    setError(null);
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  const handleUserResolved = (resolvedUser: MatchedUser, originalText: string) => {
    setResult(prevResult => {
      if (!prevResult) return null;

      const newMatchedUsers = [...prevResult.matched_users, resolvedUser];
      const newUnmatchedText = prevResult.unmatched_text.filter(text => text !== originalText);

      return {
        ...prevResult,
        matched_users: newMatchedUsers,
        unmatched_text: newUnmatchedText,
      };
    });
  };

  const handleConfirmAttendance = async () => {
    if (!result || result.matched_users.length === 0) return;

    setIsConfirming(true);
    setError(null);

    const user_ids = result.matched_users.map(user => user.user_id);
    
    // Para evitar problemas de zona horaria, ajusta la fecha al mediodía UTC antes de enviarla
    const date = new Date(selectedDate);
    date.setUTCHours(12);
    const attendance_timestamp = date.toISOString();

    try {
      await apiClient.post('/attendance/bulk-confirm/', {
        user_ids: user_ids,
        entry_method: 'WHATSAPP',
        attendance_date: attendance_timestamp,
      });
      
      alert('¡Asistencia confirmada con éxito!');
      resetState();

    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setError(err.response.data?.detail || err.response.data?.error || 'El servidor devolvió un error al confirmar.');
      } else {
        setError('No se pudo conectar con el servidor para confirmar. Revisa tu conexión.');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor sube solo archivos de imagen (PNG, JPG).');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiClient.post<OCRResponse>('/attendance/upload-whatsapp/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.error || 'El backend no pudo procesar la imagen.');
      }

    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setError(err.response.data?.error || 'El servidor devolvió un error inesperado.');
      } else {
        setError('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
        console.error("Error no esperado:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      {!result && (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors duration-200 ease-in-out cursor-pointer
            bg-gradient-to-br from-slate-800 to-slate-900
            ${isDragging ? 'border-yellow-400' : 'border-slate-700 hover:border-slate-600'}`}
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
              <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
              <p className="text-slate-300 font-medium">Procesando con IA (OCR)...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-full">
                <UploadCloud className="w-10 h-10 text-yellow-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-100">
                  Arrastra la captura de WhatsApp aquí
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  o haz clic para seleccionar la imagen
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-8 animate-fade-in">
          <h3 className="text-xl font-bold text-slate-100 border-b border-slate-700 pb-3">Resultados del Escaneo</h3>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Clientes Reconocidos */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
              <h4 className="text-green-400 font-semibold mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" /> 
                Clientes Reconocidos ({result.matched_users.length})
              </h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {result.matched_users.map((user) => (
                  <li key={user.user_id} className="text-sm flex justify-between items-center bg-slate-900/70 p-3 rounded-md border border-slate-700">
                    <button 
                      className="font-semibold text-slate-100 text-left hover:text-yellow-400 transition-colors"
                      onClick={() => alert(`Historial para: ${user.matched_name}`)} // Placeholder para futura funcionalidad
                    >
                      {user.matched_name}
                    </button>
                    <span className="text-green-400 text-xs font-mono bg-green-500/10 px-2 py-1 rounded-full">{user.confidence}%</span>
                  </li>
                ))}
                {result.matched_users.length === 0 && (
                  <li className="text-sm text-slate-500 italic p-3">No se encontraron coincidencias directas.</li>
                )}
              </ul>
            </div>

            {/* Nombres No Reconocidos */}
            {result.unmatched_text.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
                <h4 className="text-yellow-400 font-semibold mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" /> 
                  Resolver Nombres No Reconocidos ({result.unmatched_text.length})
                </h4>
                <ul className="space-y-3">
                  {result.unmatched_text.map((text, idx) => (
                    <UnmatchedRow 
                        key={idx} 
                        text={text} 
                        onUserResolved={(resolvedUser) => handleUserResolved(resolvedUser, text)} 
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-end gap-4 pt-6 border-t border-slate-700">
            <div className="flex-grow">
              <label htmlFor="attendance-date" className="block text-sm font-medium text-slate-300 mb-1">
                Fecha de Asistencia
              </label>
              <input
                type="date"
                id="attendance-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>
            <button
              onClick={resetState}
              disabled={isConfirming}
              className="h-10 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              onClick={handleConfirmAttendance}
              disabled={isConfirming || (result.unmatched_text.length > 0) || result.matched_users.length === 0}
              className="h-10 flex items-center gap-2 px-6 py-2 text-sm font-bold text-slate-900 bg-yellow-400 rounded-md hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Asistencia ({result.matched_users.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
