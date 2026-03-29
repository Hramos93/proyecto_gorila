import React, { useState, useEffect, useCallback } from 'react';
import { Users, Zap, History, RefreshCw } from 'lucide-react';
import { apiClient } from '../../../api/client';
import type { Attendance } from '../types';
import { StatCard } from '../../../components/ui/StatCard';

interface Stats {
  total_today: number;
  active_now: number;
  recent: Attendance[];
}

export const AttendanceDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Stats>('/attendances/stats/');
      // Verificamos que la respuesta tenga la estructura esperada
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="bg-slate-800/50 border border-slate-700 text-slate-100 p-6 rounded-xl space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Estado en Vivo</h2>
        <button onClick={fetchStats} disabled={isLoading} className="text-slate-400 hover:text-white disabled:opacity-50">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Hoy" value={stats?.total_today ?? 0} icon={Users} />
        <StatCard title="Activos Ahora" value={stats?.active_now ?? 0} icon={Zap} />
      </div>

      <div className="flex-grow overflow-hidden">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <History className="w-5 h-5 mr-2 text-yellow-400"/>
          Últimos Registros
        </h3>
        <ul className="space-y-2 pr-2 overflow-y-auto h-full">
          {/* CAMBIO CLAVE: Añadimos una verificación extra y un fallback [] */}
          {(stats?.recent || []).map(att => (
            <li key={att.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-100">{att.user_details}</p>
                <p className="text-xs text-slate-400">{new Date(att.timestamp).toLocaleTimeString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${att.entry_method === 'WHATSAPP' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {att.entry_method}
              </span>
            </li>
          ))}
          {!isLoading && (!stats?.recent || stats.recent.length === 0) && (
            <p className="text-sm text-slate-500 italic text-center py-4">Sin registros recientes</p>
          )}
        </ul>
      </div>
      
      <div className="flex-shrink-0 pt-4 text-center text-[10px] text-gray-500">
        <p>Energy Box C.A. - RIF: J-504118702</p>
      </div>
    </div>
  );
};