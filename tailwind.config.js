/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        felt: {
          800: '#0f3d22',
          900: '#0a2b18',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      animation: {
        'bounce-short': 'bounce 0.5s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'particle-explode': 'particle-explode 1s ease-out forwards',
        'flash-slice': 'flash-slice 1.5s ease-in-out infinite',
        'shockwave': 'shockwave 1.5s ease-out infinite',
        'shake-tilt': 'shake-tilt 0.5s ease-in-out',
        'gold-pulse': 'gold-pulse 2s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'particle-explode': {
          '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--tx), var(--ty)) scale(0)', opacity: '0' },
        },
        'flash-slice': {
          '0%, 100%': { filter: 'brightness(1) drop-shadow(0 0 0 transparent)' },
          '50%': { filter: 'brightness(1.5) drop-shadow(0 0 15px rgba(251, 191, 36, 0.8))' },
        },
        'shockwave': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.7)' },
          '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 20px rgba(251, 191, 36, 0)' },
          '100%': { transform: 'scale(1.05)', boxShadow: '0 0 0 0 rgba(251, 191, 36, 0)' },
        },
        'shake-tilt': {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateX(-5px) rotate(-2deg)' },
          '75%': { transform: 'translateX(5px) rotate(2deg)' },
        },
        'gold-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(251, 191, 36, 0.5), inset 0 0 10px rgba(251, 191, 36, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(251, 191, 36, 0.8), inset 0 0 20px rgba(251, 191, 36, 0.5)' },
        }
      },
      dropShadow: {
        'glow': '0 0 10px rgba(255, 255, 255, 0.5)',
      }
    },
  },
  plugins: [],
}