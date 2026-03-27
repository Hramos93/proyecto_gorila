// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // 1. CONTENT: Le dice a Tailwind qué archivos revisar para encontrar clases CSS.
  // Es vital incluir todas las extensiones de React y TypeScript.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // 2. THEME: Aquí extendemos el diseño por defecto.
  theme: {
    extend: {
      // Agregamos colores personalizados para el CRM del gimnasio
      colors: {
        // APLICADO: Paleta de colores para transmitir energía y profesionalismo.
        brand: {
          primary: '#0EA5E9', // sky-500 para acciones principales y foco
          success: '#10B981', // green-500 para estados de éxito
          warning: '#F59E0B', // amber-500 para advertencias
          danger: '#EF4444',  // red-500 para errores o estados vencidos
        },
        // APLICADO: Colores semánticos para estados de UI (pagos, alertas, etc.)
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      }
    },
  },
  
  // 3. PLUGINS: Aquí se pueden agregar plugins oficiales en el futuro (ej. formularios)
  plugins: [],
}