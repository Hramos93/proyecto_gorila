import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Loader, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../../api/client';
import type { Customer } from '../types';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

export const CustomerList = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiClient.get('/customers/', {
                    params: { search: debouncedSearchTerm },
                });
                setCustomers(response.data);
            } catch (err) {
                setError('Failed to fetch customers.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomers();
    }, [debouncedSearchTerm]);

    const formatStatus = (isActive: boolean, lastAttendance: string | null) => {
        if (!lastAttendance) {
            return { text: 'Nunca Asistió', color: 'bg-zinc-500' };
        }
        const lastDate = new Date(lastAttendance);
        const diffDays = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
        
        if (!isActive) return { text: 'Inactivo', color: 'bg-red-500' };
        if (diffDays <= 7) return { text: 'Activo', color: 'bg-green-500' };
        if (diffDays <= 30) return { text: 'Reciente', color: 'bg-yellow-500' };
        return { text: 'Inactivo', color: 'bg-red-500' };
    };

    return (
        <div className="bg-zinc-950 min-h-screen text-white p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-3">
                    <Users className="w-8 h-8" />
                    Directorio de Clientes
                </h1>
                <div className="mt-4 flex justify-between items-center">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellido, DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-md pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-zinc-400 text-sm">Total de Clientes</p>
                        <p className="text-2xl font-bold text-yellow-400">{customers.length}</p>
                    </div>
                </div>
            </header>

            <main>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="w-12 h-12 text-yellow-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-400 flex flex-col items-center gap-4">
                        <AlertTriangle className="w-12 h-12" />
                        <p>{error}</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="text-center text-zinc-400">
                        <p>No se encontraron clientes{debouncedSearchTerm && ` que coincidan con "${debouncedSearchTerm}"`}.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-zinc-800">
                        <table className="min-w-full divide-y divide-zinc-800">
                            <thead className="bg-zinc-900">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Nombre</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">DNI</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Teléfono</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Estado</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-zinc-950 divide-y divide-zinc-800">
                                {customers.map((customer) => {
                                    const status = formatStatus(customer.is_active, customer.last_attendance_date);
                                    return (
                                        <tr key={customer.id} className="hover:bg-zinc-800/50 transition-colors border-l-4 border-transparent hover:border-yellow-500">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{customer.full_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 font-mono">{customer.dni}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">{customer.phone || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color} text-white`}>
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link to={`/customers/${customer.id}`} className="text-yellow-400 hover:text-yellow-300">
                                                    Ver Perfil
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};
