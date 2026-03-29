import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, Check, X, Image as ImageIcon } from 'lucide-react';
import { isAxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../../api/client';
import type { OCRResponse, MatchedUser } from '../types';
import { UnmatchedRow } from './UnmatchedRow';

export const WhatsAppUploader = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPreview(null);
    setIsLoading(false);
    setIsConfirming(false);
    setResult(null);
    setError(null);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes (PNG, JPG).');
      return;
    }

    // Generar previsualización
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiClient.post<OCRResponse>('/attendances/upload-whatsapp/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setResult(response.data);
        toast.success('Imagen procesada con éxito.');
      } else {
        setError(response.data.error || 'No se detectaron nombres en la imagen.');
      }
    } catch (err) {
      setError('Error de conexión con el motor de IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!result) return;
    setIsConfirming(true);
    try {
      await apiClient.post('/attendances/bulk-confirm/', {
        user_ids: result.matched_users.map(u => u.user_id),
        entry_method: 'WHATSAPP',
        attendance_date: selectedDate,
      });
      toast.success('¡Asistencias registradas!');
      resetState();
    } catch (err) {
      toast.error('Error al confirmar las asistencias.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
            ${isLoading ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/30'}`}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          
          {isLoading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mb-4" />
              <p className="text-zinc-100 font-bold uppercase tracking-wider">Escaneando socios...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-zinc-800 rounded-full mb-4">
                <UploadCloud className="w-8 h-8 text-yellow-400" />
              </div>
              <p className="text-lg font-bold text-white">Cargar captura de WhatsApp</p>
              <p className="text-sm text-zinc-500 mt-1">Haz clic o arrastra la imagen aquí</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Previsualización y Fecha */}
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                <div className="p-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Captura Original</span>
                    <button onClick={resetState} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                {preview && <img src={preview} alt="Preview" className="w-full h-auto max-h-80 object-contain p-2" />}
            </div>
            
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Fecha de los Registros</label>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:ring-1 focus:ring-yellow-400"
                />
            </div>
          </div>

          {/* Resultados del OCR */}
          <div className="space-y-4">
            <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
                <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Socios Identificados ({result.matched_users.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {result.matched_users.map(user => (
                        <div key={user.user_id} className="flex justify-between items-center bg-zinc-800/50 p-3 rounded-lg border border-zinc-700">
                            <span className="text-sm font-medium text-white">{user.matched_name}</span>
                            <span className="text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-1 rounded-md">{user.confidence}%</span>
                        </div>
                    ))}
                </div>
                
                <button 
                    onClick={handleConfirmAttendance}
                    disabled={isConfirming || result.matched_users.length === 0}
                    className="w-full mt-6 bg-yellow-400 text-zinc-900 font-bold py-3 rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isConfirming ? <Loader2 className="animate-spin" /> : <><Check className="w-5 h-5" /> Confirmar Registros</>}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};  