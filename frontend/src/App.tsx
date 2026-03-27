import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CustomerListPage from './features/customers/CustomerListPage';
import { WhatsAppUploader } from './features/attendance/components/WhatsAppUploader';

// Un componente Home básico con botones de navegación
const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Energy Box CRM</h1>
      <div className="flex flex-wrap justify-center gap-4">
        <Link 
          to="/customers" 
          className="bg-brand-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-md"
        >
          Gestión de Clientes
        </Link>
        <Link 
          to="/attendance" 
          className="bg-brand-success text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-md"
        >
          Control de Asistencia
        </Link>
        <Link 
          to="/login" 
          className="bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors shadow-md"
        >
          Iniciar Sesión
        </Link>
      </div>
    </div>
  );
};

// Un placeholder temporal para el Login
const DummyLogin = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <h2 className="text-2xl font-bold mb-4 text-gray-800">Página de Login (En construcción)</h2>
    <Link to="/" className="text-brand-primary hover:underline">
      &larr; Volver al inicio
    </Link>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La ruta raíz ("/") ahora muestra el Home en lugar de redirigir */}
        <Route path="/" element={<Home />} />
        
        {/* La nueva página de clientes estará en la ruta /customers */}
        <Route path="/customers" element={<CustomerListPage />} />

        {/* Conectamos la página de Asistencia que ya tenías */}
        <Route path="/attendance" element={<WhatsAppUploader />} />

        {/* Ruta temporal para el Login */}
        <Route path="/login" element={<DummyLogin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;