import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Loader2, CheckCircle, CheckCircle2, Check, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { attendanceService } from '../../../api/attendanceService';
import type { OCRResponse, MatchedUser } from '../types';
import { UnmatchedRow } from './UnmatchedRow';

export const WhatsAppUploader = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [result, setResult] = useState<OCRResponse | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // --- NUEVOS ESTADOS: Trazabilidad Masiva ---
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NUEVO EFECTO: Cargar listas de selectores ---
  useEffect(() => {
      const fetchSelectors = async () => {
          try {
              const [classesRes, trainersRes] = await Promise.all([
                  attendanceService.getClasses(),
                  attendanceService.getTrainers()
              ]);
              setAvailableClasses(classesRes);
              setAvailableTrainers(trainersRes);
          } catch (err) {
              console.error("Error cargando selectores", err);
              toast.error("Error al cargar la lista de clases y entrenadores.");
          }
      };
      fetchSelectors();
  }, []);

  const resetState = () => {
    setPreview(null);
    setIsLoading(false);
    setIsConfirming(false);
    setResult(null);
    setSelectedIds([]);
    setSelectedClass('');   // Limpiamos la clase seleccionada
    setSelectedTrainer(''); // Limpiamos el entrenador seleccionado
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes (PNG, JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsLoading(true);

    try {
      const data = await attendanceService.uploadWhatsAppImage(file);

      if (data.success !== false && data.matched_users) {
        setResult(data);
        setSelectedIds(data.matched_users.map((u: MatchedUser) => u.user_id));
        toast.success('Imagen procesada con éxito.');
      } else {
        toast.error(data.error || 'No se detectaron nombres válidos en la imagen.');
        resetState();
      }
    } catch (err) {
      toast.error('Error de conexión con el motor de IA.');
      resetState();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleUserResolved = (newUser: MatchedUser, originalName: string) => {
    setResult(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        matched_users: [...prev.matched_users, newUser],
        unmatched_text: prev.unmatched_text?.filter(name => name !== originalName) || []
      };
    });
    setSelectedIds(prev => [...prev, newUser.user_id]);
    toast.success('¡Socio vinculado y añadido a la lista!');
  };

  const handleConfirmAttendance = async () => {
    if (!result || selectedIds.length === 0) return;

    // --- NUEVO CANDADO: Validar selectores obligatorios ---
    if (!selectedClass || !selectedTrainer) {
        toast.error("Por favor, seleccione una clase y un entrenador.");
        return;
    }

    setIsConfirming(true);
    try {
      // --- ACTUALIZADO: Envío de parámetros completos ---
      await attendanceService.bulkConfirm(selectedIds, selectedDate, selectedTrainer, selectedClass);
      toast.success(`¡${selectedIds.length} Asistencias registradas!`);
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
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} 
          />
          
          {isLoading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mb-4" />
              <p className="text-zinc-100 font-bold uppercase tracking-wider">Escaneando socios...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-zinc-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-yellow-400" />
              </div>
              <p className="text-lg font-bold text-white">Cargar captura de WhatsApp</p>
              <p className="text-sm text-zinc-500 mt-1">Haz clic o arrastra la imagen aquí</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                <div className="p-3 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Captura Original
                    </span>
                    <button onClick={resetState} className="text-zinc-500 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                </div>
                {preview && (
                  <div className="bg-black flex justify-center items-center">
                    <img src={preview} alt="Preview" className="w-full h-auto max-h-80 object-contain p-2" />
                  </div>
                )}
            </div>
            
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Fecha de los Registros</label>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-yellow-400 transition-colors"
                />
            </div>
          </div>

          <div className="space-y-4 flex flex-col h-full">
            <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex-grow flex flex-col">
                <h4 className="text-green-400 font-bold mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Socios Identificados
                    </span>
                    <span className="bg-zinc-800 text-white px-2 py-0.5 rounded-md text-xs">
                      {selectedIds.length} / {result.matched_users.length}
                    </span>
                </h4>
                
                <div className="space-y-2 flex-grow overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
                    {result.matched_users.map(user => {
                      const isSelected = selectedIds.includes(user.user_id);
                      return (
                        <div 
                          key={user.user_id} 
                          onClick={() => toggleSelection(user.user_id)}
                          className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-800/30 border-zinc-700 opacity-60 grayscale'
                          }`}
                        >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-green-500 border-green-500' : 'border-zinc-500'}`}>
                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-zinc-900" />}
                              </div>
                              <span className="text-sm font-bold text-white">{user.matched_name}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${isSelected ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                              {user.confidence}%
                            </span>
                        </div>
                      );
                    })}
                </div>
                
                {result.unmatched_text && result.unmatched_text.length > 0 && (
                   <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-xs font-bold text-zinc-500 uppercase mb-2">No encontrados en Base de Datos</p>
                      <ul className="space-y-2">
                        {result.unmatched_text.map((name, idx) => (
                          <UnmatchedRow 
                            key={idx} 
                            text={name}  
                            onUserResolved={(newUser) => handleUserResolved(newUser, name)} 
                          />
                        ))}
                      </ul>
                   </div>
                )}
                
                {/* --- NUEVA INTERFAZ: Selectores de Clase y Entrenador --- */}
                <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col gap-3">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Trazabilidad de la Clase</p>
                    <div className="flex flex-col gap-2">
                        <select 
                            value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-sm p-3 rounded-lg text-white outline-none focus:border-yellow-400 transition-colors"
                        >
                            <option value="" disabled>Seleccione una clase...</option>
                            {availableClasses.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.schedule_time})</option>
                            ))}
                        </select>
                        <select 
                            value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-sm p-3 rounded-lg text-white outline-none focus:border-yellow-400 transition-colors"
                        >
                            <option value="" disabled>Seleccione el entrenador a cargo...</option>
                            {availableTrainers.map(t => (
                                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button 
                    onClick={handleConfirmAttendance}
                    disabled={isConfirming || selectedIds.length === 0 || !selectedClass || !selectedTrainer}
                    className="w-full mt-4 bg-yellow-400 text-zinc-900 font-bold py-3 rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isConfirming ? <Loader2 className="animate-spin" /> : <><Check className="w-5 h-5" /> Confirmar ({selectedIds.length}) Registros</>}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};