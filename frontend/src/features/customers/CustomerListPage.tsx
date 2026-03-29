// src/features/customers/CustomerListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from './services/customerService';
import { User as Customer } from '../../types/user';
import { Search, MoreVertical, AlertTriangle, UserPlus, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

const CustomerListPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null); // Limpiamos errores previos
        const data = await getCustomers();
        setCustomers(data);
      } catch (err: any) {
        // Ahora el error sí llegará aquí desde el servicio
        const status = err.response?.status;
        if (status === 401 || status === 403) {
            setError("No tienes permisos para ver la lista de clientes o tu sesión expiró.");
        } else {
            setError("Error al conectar con el servidor (Django). Verifica que esté encendido.");
        }
      } finally {
        setLoading(false); 
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const customersArray = Array.isArray(customers) ? customers : [];
    return customersArray.filter(c => {
      const searchStr = `${c.first_name} ${c.last_name} ${c.dni || ''} ${c.internal_code || ''}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [customers, searchTerm]);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Maestra de Clientes</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gestiona la base de datos de <span className="text-yellow-400 font-bold">{filteredCustomers.length}</span> socios.
          </p>
        </div>
        <button 
          onClick={() => toast.success('Módulo de registro en desarrollo')}
          className="flex items-center gap-2 bg-yellow-400 text-zinc-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Socio
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, CI o código..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-yellow-400 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-zinc-400 hover:text-white">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <SkeletonLoader rows={6} />
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl flex flex-col items-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Socio</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Identificación</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Estado Pago</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-yellow-400/5 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar url={customer.avatar_url} name={customer.first_name} />
                        <div>
                          <p className="font-semibold text-zinc-100 group-hover:text-yellow-400 transition-colors">
                            {customer.first_name} {customer.last_name}
                          </p>
                          <p className="text-xs text-zinc-500 font-mono">{customer.internal_code || 'S/C'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400 font-mono">
                      {customer.dni}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={customer.payment_status} />
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCustomers.length === 0 && (
              <div className="p-12 text-center text-zinc-500 italic">No se encontraron socios registrados en la base de datos.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerListPage;