import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../api/client';
import type { CustomerBoard, CustomerCard } from '../types';

// UI Components compartidos (Paso 2)
import { Avatar } from '../../../components/ui/Avatar';

// --- Componentes Internos del Tablero ---

const CustomerCardComponent = ({ customer }: { customer: CustomerCard }) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Link 
            to={`/customers/${customer.id}`} 
            className="group block bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/50 hover:border-yellow-400/50 hover:bg-zinc-800/80 transition-all shadow-sm"
        >
            <div className="flex items-center justify-between mb-2">
                <Avatar name={customer.full_name} />
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-yellow-400 transform group-hover:translate-x-1 transition-all" />
            </div>
            <p className="font-bold text-zinc-100 truncate group-hover:text-yellow-400 transition-colors">
                {customer.full_name}
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                <span>Vence: {formatDate(customer.membership_end_date)}</span>
            </div>
        </Link>
    );
};

const BoardColumn = ({ title, customers, color, count }: { title: string; customers: CustomerCard[]; color: string; count: number }) => {
    return (
        <div className="bg-zinc-900/50 rounded-2xl flex-1 min-w-[300px] border border-zinc-800/50 flex flex-col h-[calc(100vh-12rem)]">
            <div className={`p-4 border-b-2 ${color} bg-zinc-900/80 rounded-t-2xl sticky top-0 z-10`}>
                <h3 className="font-bold text-zinc-100 flex justify-between items-center">
                    {title}
                    <span className="text-xs font-bold bg-zinc-800 text-yellow-400 px-2.5 py-1 rounded-lg border border-zinc-700">
                        {count}
                    </span>
                </h3>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-grow">
                {customers.length > 0 ? (
                    customers.map(customer => <CustomerCardComponent key={customer.id} customer={customer} />)
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center text-zinc-600">
                        <User className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-xs italic">Sin registros</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Componente Principal ---

export const CustomerList = () => {
    const [boardData, setBoardData] = useState<CustomerBoard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBoardData = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get<CustomerBoard>('/customers/board/');
                setBoardData(response.data);
            } catch (err) {
                setError('Error al sincronizar el tablero de membresías.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBoardData();
    }, []);

    const columnConfig = {
        active: { title: 'Activos', color: 'border-green-500' },
        due: { title: 'Por Vencer', color: 'border-yellow-500' },
        expired: { title: 'Vencidos', color: 'border-red-500' },
        never_active: { title: 'Inactivos', color: 'border-zinc-700' }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-zinc-500">
                <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mb-4" />
                <p className="font-medium animate-pulse uppercase text-xs tracking-widest">Cargando Tablero...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] text-red-400 p-6 text-center">
                <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-bold">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 text-sm text-zinc-400 underline hover:text-white"
                >
                    Reintentar conexión
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Kanban className="w-7 h-7 text-yellow-400" />
                    Tablero de Membresías
                </h1>
                <p className="text-zinc-400 text-sm mt-1">
                    Vista general del estado de pagos de <span className="text-white font-bold">Energy Box</span>.
                </p>
            </header>
            
            <main className="flex gap-6 overflow-x-auto pb-6 snap-x">
                {boardData && Object.entries(boardData).map(([key, customers]) => {
                    const config = columnConfig[key as keyof typeof columnConfig];
                    return (
                        <BoardColumn
                            key={key}
                            title={config.title}
                            color={config.color}
                            customers={customers}
                            count={customers.length}
                        />
                    );
                })}
            </main>
        </div>
    );
};

// Icono faltante para el título
const Kanban = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 5v11"/><path d="M12 5v6"/><path d="M18 5v14"/></svg>
);

export default CustomerList;