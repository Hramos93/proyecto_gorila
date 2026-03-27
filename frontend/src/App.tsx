import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CustomerListPage from './features/customers/CustomerListPage';
import { WhatsAppUploader } from './features/attendance/components/WhatsAppUploader';

// --- Componentes de Interfaz ---

const Header = () => (
  <header className="bg-white border-b border-gray-100 py-4 px-8 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center w-12 h-10 bg-black rounded-full">
        <span className="text-yellow-400 text-2xl">⚡</span>
      </div>
      <div>
        <p className="text-[10px] text-gray-500 leading-none">J-504118702</p>
        <h1 className="text-xl font-bold tracking-tight">ENERGY BOX C.A.</h1>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="hidden sm:flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 font-bold">UG</div>
        <span className="text-sm font-medium text-gray-700">User Generic</span>
      </div>
      <nav className="flex gap-4 text-sm font-semibold text-purple-800">
        <Link to="/login" className="hover:text-purple-600">Cerrar Sesión</Link>
      </nav>
    </div>
  </header>
);

const AttendanceWidget = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-2xl mx-auto text-center my-12">
      <h2 className="text-5xl font-mono font-bold text-gray-800 mb-2">{time}</h2>
      <p className="text-gray-400 text-sm mb-8 uppercase tracking-widest font-semibold">Último Registro: N/A</p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          to="/attendance" 
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <span>➔</span> Registrar Entrada
        </Link>
        <button className="border-2 border-yellow-400 text-gray-700 hover:bg-yellow-50 font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2">
          <span>←</span> Registrar Salida
        </button>
      </div>
    </div>
  );
};

const FeatureCard = ({ to, title, icon, color }: { to: string, title: string, icon: string, color: string }) => (
  <Link to={to} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-50 flex items-center gap-4 group">
    <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <span className="text-lg font-bold text-gray-800">{title}</span>
  </Link>
);

// --- Pantalla Principal ---

const Home = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans antialiased">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
            Bienvenido a Energy Box CRM – <br />
            <span className="text-gray-500 font-medium">Control de Asistencia</span>
          </h2>
        </div>
        <AttendanceWidget />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard to="/customers" title="Gestión de Clientes" icon="👥" color="bg-purple-100 text-purple-700" />
          <FeatureCard to="/attendance" title="Resumen Asistencia" icon="📅" color="bg-yellow-100 text-yellow-700" />
          <FeatureCard to="/reportes" title="Reportes Mensuales" icon="📊" color="bg-purple-50 text-purple-600" />
        </div>
      </main>
      <footer className="text-center py-8 text-gray-400 text-xs mt-12">
        <p className="mb-1 uppercase font-semibold tracking-widest">RIF: J-504118702</p>
        <p>© 2026 Energy Box C.A. - Todos los derechos reservados</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/attendance" element={<WhatsAppUploader />} />
        <Route path="/login" element={ <div className="p-10 text-center">Login en construcción</div> } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;