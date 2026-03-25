import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Dumbbell, Users, LayoutDashboard } from 'lucide-react';
import { Dashboard } from './features/dashboard/Dashboard';
import { CustomerList } from './features/customers/components/CustomerList';
import { CustomerDetail } from './features/customers/components/CustomerDetail';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-yellow-400 selection:text-black">
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                  <Dumbbell className="text-yellow-400 w-8 h-8" />
                  <h1 className="text-2xl font-bold tracking-tighter">
                      ENERGY<span className="text-yellow-400">BOX</span>
                  </h1>
              </div>
              <nav className="flex items-center gap-4">
                <NavLink to="/" end className={({ isActive }) =>`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-yellow-400 text-zinc-900' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/customers" className={({ isActive }) =>`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-yellow-400 text-zinc-900' : 'text-zinc-300 hover:bg-zinc-800'}`}>
                  <Users className="w-4 h-4" />
                  Clientes
                </NavLink>
              </nav>
            </div>
            <div className="text-sm text-zinc-500">
              CRM Administrativo
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;