import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import * as authService from '../features/auth/services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: authService.LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay una sesión activa al cargar la app
  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authService.checkSession();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials: authService.LoginCredentials) => {
    const userData = await authService.login(credentials);
    setUser(userData);
  };

 const logout = async () => {
  try {
    // Intentamos avisar al servidor, pero no bloqueamos el proceso si falla
    await authService.logout();
  } catch (error) {
    console.warn("No se pudo cerrar sesión en el servidor, limpiando localmente...");
  } finally {
    // IMPORTANTE: Siempre limpiamos el estado local y redirigimos
    setUser(null);
    localStorage.removeItem('token'); // Si usas tokens, asegúrate de limpiarlos
    window.location.href = '/login'; 
  }
};

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};