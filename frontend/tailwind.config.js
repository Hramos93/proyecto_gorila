/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores de Energy Box C.A.
        brand: {
         yellow: '#FFD700', // Amarillo del rayo
         purple: '#4C1D95', // Morado para los enlaces y detalles
         dark: '#000000',   // Negro del logo
         light: '#F8F9FA',  // Gris muy claro para el fondo
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}