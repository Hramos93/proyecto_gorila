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
        brand: {
          dark: '#1a1a1a', // Un gris casi negro para los fondos principales
          neon: '#ccff00', // Un verde/amarillo neón muy usado en fitness
          gray: '#2d2d2d', // Gris secundario para tarjetas y paneles
        }
      }
    },
  },
  
  // 3. PLUGINS: Aquí se pueden agregar plugins oficiales en el futuro (ej. formularios)
  plugins: [],
}