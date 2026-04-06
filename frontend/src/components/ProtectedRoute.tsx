// src/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Añadimos una interfaz para recibir los roles permitidos por Props
interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // 1. Cargador inicial
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-yellow-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-zinc-400 animate-pulse">Verificando credenciales...</p>
      </div>
    );
  }

  // 2. Si no hay sesión, al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. VALIDACIÓN DE ROLES (¡El nuevo escudo!)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Disparamos un aviso y lo enviamos de vuelta al dashboard base o al login
    // El setTimeout evita advertencias de React por renderizado simultáneo
    setTimeout(() => {
        toast.error('Acceso denegado: Tu rol no tiene permisos para esta área.');
    }, 100);
    
    // Si es cliente, lo mandamos a una futura vista de cliente. Si es staff, al dashboard general.
    return <Navigate to="/" replace />; 
  }

  // 4. Si todo está en orden, mostramos la ruta
  return <Outlet />;
};