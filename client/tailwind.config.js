/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        surface: { 50: '#eef2ff', 100: '#e0e7ff', 800: '#1e1b4b', 900: '#13103a', 950: '#0f0a1a' },
        accent: { 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5' },
      }
    }
  },
  plugins: []
};
