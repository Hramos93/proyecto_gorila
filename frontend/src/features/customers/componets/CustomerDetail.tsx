import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Phone, Fingerprint, Calendar, ArrowLeft, Loader2, AlertTriangle, History } from 'lucide-react';
import { apiClient } from '../../../api/client';
import type { Customer } from '../types'; 

// Attendance type - should probably be in its own types file, but fine here for now.
interface AttendanceRecord {
    id: number;
    user_details: string;
    timestamp: string;
    entry_method: 'MANUAL' | 'WHATSAPP' | 'BIOMETRIC';
}

export const CustomerDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const customerPromise = apiClient.get<Customer>(`/customers/${id}/`);
                const historyPromise = apiClient.get<AttendanceRecord[]>(`/attendance/?user_id=${id}`);

                const [customerResponse, historyResponse] = await Promise.all([customerPromise, historyPromise]);
                
                setCustomer(customerResponse.data);
                setHistory(historyResponse.data);

            } catch (err) {
                setError('No se pudo cargar la información del cliente.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] text-red-400">
                <AlertTriangle className="w-12 h-12" />
                <p className="mt-4 text-lg">{error}</p>
            </div>
        );
    }

    if (!customer) return null;

    const InfoPill = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | null }) => (
        <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-yellow-400 mt-1" />
            <div>
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="font-medium text-slate-100">{value || 'No registrado'}</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-zinc-950 text-white min-h-screen">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">{customer.full_name}</h1>
                    <p className="text-yellow-400">Perfil del Cliente</p>
                </div>
                <Link to="/customers" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-300 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Tablero
                </Link>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna de Perfil */}
                <aside className="lg:col-span-1 bg-zinc-900 p-6 rounded-xl border border-zinc-800 self-start">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                            <User className="w-12 h-12 text-yellow-400" />
                        </div>
                    </div>
                    <div className="space-y-5">
                        <InfoPill icon={Fingerprint} label="Documento de Identidad" value={customer.dni} />
                        <InfoPill icon={Phone} label="Número de Teléfono" value={customer.phone} />
                    </div>
                </aside>

                {/* Columna de Historial */}
                <main className="lg:col-span-2">
                    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-3">
                            <History className="text-yellow-400" />
                            Historial de Asistencia
                        </h2>
                        <div className="overflow-x-auto max-h-96">
                            {history.length > 0 ? (
                                <table className="min-w-full divide-y divide-zinc-800">
                                    <thead className="bg-zinc-900 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Hora</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Método</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {history.map(record => (
                                            <tr key={record.id} className="hover:bg-zinc-800/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                                                    {new Date(record.timestamp).toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 font-mono">
                                                    {new Date(record.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${
                                                        record.entry_method === 'WHATSAPP' ? 'bg-green-600' : 'bg-blue-600'
                                                    }`}>
                                                        {record.entry_method}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-center text-zinc-400 py-8">No hay registros de asistencia para este cliente.</p>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
