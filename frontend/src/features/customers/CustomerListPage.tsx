import React, { useState, useEffect, useMemo } from 'react';
import { getCustomers } from './services/customerService';
import { User as Customer } from '../../types/user'; // Usamos la interfaz User y la renombramos para mayor claridad
import { MagnifyingGlassIcon, EllipsisVerticalIcon, UserCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

// --- ÁTOMOS DE UI (Componentes Atómicos) ---
// En un proyecto real, estos estarían en su propio directorio (e.g., /components/ui)

const Badge = ({ status }: { status: Customer['payment_status'] }) => {
  const statusConfig = {
    PAID: { styles: 'bg-green-100 text-green-800', text: 'Al día' },
    PENDING: { styles: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
    OVERDUE: { styles: 'bg-red-100 text-red-800', text: 'Vencido' },
  };
  const { styles, text } = statusConfig[status] || statusConfig.PENDING; // Fallback a PENDING si el status es inesperado
  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles}`}>
      {text}
    </span>
  );
};

const Avatar = ({ customer }: { customer: Customer }) => {
  return customer.avatar_url ? (
    <img className="h-10 w-10 rounded-full object-cover" src={customer.avatar_url} alt={`${customer.first_name}`} />
  ) : (
    <UserCircleIcon className="h-10 w-10 text-gray-300" />
  );
};

const SkeletonLoader = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// --- MOLÉCULAS DE UI (Componentes Compuestos) ---

const CustomerCard = ({ customer }: { customer: Customer }) => (
  <div className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4">
    <Avatar customer={customer} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{`${customer.first_name} ${customer.last_name}`}</p>
      <p className="text-sm text-gray-500 truncate">{customer.internal_code || 'Sin código'}</p>
      <div className="mt-1">
        <Badge status={customer.payment_status} />
      </div>
    </div>
    <div className="flex-shrink-0">
      {/* En una app real, este botón abriría un menú (Dropdown) con acciones */}
      <button className="p-1 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
        <span className="sr-only">Acciones para {customer.first_name}</span>
        <EllipsisVerticalIcon className="h-6 w-6" />
      </button>
    </div>
  </div>
);

// --- ORGANISMO DE UI (Componente Principal) ---

const CustomerListPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data: Customer[] = await getCustomers();
        setCustomers(data);
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar los clientes. Asegúrate de haber iniciado sesión como administrador.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() =>
    customers.filter(customer =>
      `${customer.first_name} ${customer.last_name} ${customer.internal_code || ''} ${customer.document_number}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ), [customers, searchTerm]);

  return (
    <main className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Maestra de Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total de clientes activos: {customers.length}
          </p>
        </header>

        {/* Barra de Búsqueda - Optimizada para Check-in rápido */}
        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="search"
            name="search"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            placeholder="Buscar cliente por nombre, código o documento..."
          />
        </div>

        {loading && <SkeletonLoader />}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Vista de Tabla para Desktops (Organismo) */}
            <div className="hidden md:block shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado de Pago</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10"><Avatar customer={customer} /></div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{`${customer.first_name} ${customer.last_name}`}</div>
                            <div className="text-sm text-gray-500">{`${customer.document_type}-${customer.document_number}`}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.internal_code || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><Badge status={customer.payment_status} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="p-1 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                          <span className="sr-only">Acciones para {customer.first_name}</span>
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de Tarjetas para Móviles (Organismo) */}
            <div className="md:hidden space-y-4">
              {filteredCustomers.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default CustomerListPage;