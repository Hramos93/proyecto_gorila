import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';
import { BillingPage } from './features/billing/components/BillingPage'; // Ajusta la ruta de importación

// CARGA PEREZOSA (Lazy Loading)
// El navegador solo descargará estos archivos cuando el usuario los necesite.
const LoginPage = lazy(() => import('./features/auth/componets/LoginPage').then(m => ({ default: m.LoginPage })));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const CustomerListPage = lazy(() => import('./features/customers/CustomerListPage'));
const CustomerList = lazy(() => import('./features/customers/componets/CustomerList').then(m => ({ default: m.CustomerList })));
const CustomerDetail = lazy(() => import('./features/customers/componets/CustomerDetail').then(m => ({ default: m.CustomerDetail })));

/**
 * Pantalla de carga mientras se descarga el componente perezoso.
 */
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
    <Loader2 className="w-10 h-10 animate-spin text-yellow-400 mb-4" />
    <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Cargando Módulo...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        
        {/* Suspense es necesario para manejar la espera de los componentes Lazy */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<LoginPage />} />

            {/* PASO 4: Rutas Protegidas con Validación de Roles.
              Solo permitimos el acceso al CRM a usuarios con rol ADMIN o STAFF.
            */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<CustomerListPage />} />
                <Route path="/board" element={<CustomerList />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/billing" element={<BillingPage />} />
              </Route>
            </Route>

            {/* Redirección por defecto: 
              Si la ruta no existe o el usuario no tiene permiso, 
              ProtectedRoute se encargará de enviarlo al login o al dashboard.
            */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;