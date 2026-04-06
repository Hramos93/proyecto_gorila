import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Kanban, LogOut, Dumbbell, CreditCard } from 'lucide-react'; // <-- AÑADIDO CreditCard
import { useAuth } from '../context/AuthContext';

export const MainLayout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  // AÑADIDA RUTA DE FACTURACIÓN
  const navigation = [
    { name: 'Portal OCR', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Facturación', href: '/billing', icon: CreditCard }, // <-- NUEVA PESTAÑA
    { name: 'Tablero Kanban', href: '/board', icon: Kanban },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-8 h-8 text-yellow-400" />
              <span className="text-xl font-bold text-white tracking-tight">
                ENERGY<span className="text-yellow-400">BOX</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'text-yellow-400 bg-yellow-400/10' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-4 border-l border-zinc-800 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-zinc-500 uppercase font-bold">Operador</p>
                <p className="text-sm text-zinc-200 font-medium">{user?.first_name || 'Admin'}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-zinc-900 border-t border-zinc-800 py-4">
        <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest">
          Energy Box C.A. - Control de Gestión v1.0
        </p>
      </footer>
    </div>
  );
};