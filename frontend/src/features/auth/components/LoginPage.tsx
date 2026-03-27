import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { login } from '../services/authService';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ username, password });
      toast.success('¡Bienvenido!');
      // Recargamos la página para que App.tsx pueda detectar la nueva sesión.
      // Una solución más avanzada usaría un estado global (Context, Redux, etc.).
      window.location.href = '/';
    } catch (error) {
      toast.error('Credenciales incorrectas. Inténtalo de nuevo.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900 rounded-lg border border-zinc-800">
        <h2 className="text-2xl font-bold text-center text-white">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-400">
              Usuario (DNI)
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="Tu número de documento"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-400">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="••••••••"
            />
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-zinc-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-zinc-600 disabled:cursor-not-allowed">
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};