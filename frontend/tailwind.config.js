/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // activado/desactivado con la clase .dark en <html>
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Azul institucional (inspirado en Comfandi)
        institucional: {
          50: '#EAF2FC',
          100: '#D2E4F8',
          200: '#A6C9F1',
          300: '#78ACE9',
          400: '#4C8FE0',
          500: '#2670CB',
          600: '#0B4F9E',
          700: '#073B78',
          800: '#052A57',
          900: '#031A38',
        },
        // Turquesa / verde claro (acentos y estados activos)
        turquesa: {
          50: '#E6FBF9',
          100: '#C1F5F0',
          200: '#8CE9E1',
          300: '#57DDCE',
          400: '#25CCBB',
          500: '#0FB5A5',
          600: '#0B9285',
          700: '#08716A',
          800: '#06544F',
          900: '#043B38',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(11, 79, 158, 0.12)',
        'soft-lg': '0 12px 40px -8px rgba(11, 79, 158, 0.18)',
        'soft-dark': '0 12px 40px -8px rgba(0, 0, 0, 0.45)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(220%)' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
        'scan-line': 'scan-line 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
