/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aurora: {
          50: '#f0f4ff', 100: '#dce4ff', 200: '#b6c8ff',
          300: '#8aa8ff', 400: '#5a84ff', 500: '#3a6bff',
          600: '#2a4fd8', 700: '#1f3baf', 800: '#162a86', 900: '#0e1a5e'
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    }
  },
  plugins: []
}
