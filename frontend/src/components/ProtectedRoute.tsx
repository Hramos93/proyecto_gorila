import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mientras verifica la sesión, mostramos un cargador
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-yellow-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-zinc-400 animate-pulse">Verificando credenciales...</p>
      </div>
    );
  }

  // Si no está autenticado, redirige al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, permite ver el contenido (Outlet)
  return <Outlet />;
};