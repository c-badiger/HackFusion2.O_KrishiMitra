/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        krishi: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          dark: '#0f291e'
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706'
        }
      },
      fontFamily: {
        kannada: ['"Noto Sans Kannada"', 'sans-serif'],
        sans: ['Inter', '"Noto Sans Kannada"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
