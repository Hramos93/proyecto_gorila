import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../../api/client';
import type { CustomerBoard, CustomerCard } from '../types';

// --- Reusable Components ---

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
        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 hover:border-yellow-400 transition-colors cursor-pointer">
            <Link to={`/customers/${customer.id}`} className="block">
                <p className="font-semibold text-slate-100 truncate">{customer.full_name}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                    <Calendar className="w-3 h-3" />
                    <span>Vence: {formatDate(customer.membership_end_date)}</span>
                </div>
            </Link>
        </div>
    );
};

const BoardColumn = ({ title, customers, color, count }: { title: string; customers: CustomerCard[]; color: string; count: number }) => {
    return (
        <div className="bg-zinc-900 rounded-xl flex-1 min-w-[280px]">
            <div className={`p-4 border-b-4 ${color} rounded-t-xl`}>
                <h3 className="font-bold text-lg text-slate-100 flex justify-between items-center">
                    {title}
                    <span className="text-sm font-semibold bg-zinc-700/50 text-slate-300 px-2.5 py-1 rounded-full">{count}</span>
                </h3>
            </div>
            <div className="p-4 space-y-3 h-[calc(100vh-20rem)] overflow-y-auto">
                {customers.length > 0 ? (
                    customers.map(customer => <CustomerCardComponent key={customer.id} customer={customer} />)
                ) : (
                    <div className="text-center text-sm text-zinc-500 pt-8">
                        <p>No hay clientes en esta categoría.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main Board Component ---

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
                setError('No se pudo cargar la información del tablero.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBoardData();
    }, []);

    const columnConfig = {
        active: { title: 'Activos', color: 'border-green-500' },
        due: { title: 'Próximos a Vencer', color: 'border-yellow-500' },
        expired: { title: 'Vencidos', color: 'border-red-500' },
        never_active: { title: 'Nunca Activos', color: 'border-zinc-600' }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                <Loader2 className="w-16 h-16 text-yellow-400 animate-spin" />
                <p className="ml-4 text-lg">Cargando Tablero...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] text-red-400">
                <AlertCircle className="w-16 h-16" />
                <p className="mt-4 text-lg">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-zinc-950" data-testid="customer-kanban-board">
             <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                    <User className="w-8 h-8 text-yellow-400" />
                    Tablero de Clientes
                </h1>
                <p className="text-zinc-400 mt-1">Gestiona el estado de las membresías de tus clientes de forma visual.</p>
            </header>
            <main className="flex gap-6 overflow-x-auto pb-4">
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
