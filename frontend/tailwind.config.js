/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        biodome: {
          bg: '#080d12',
          surface: '#0d1a1f',
          card: '#111e24',
          border: '#1a3040',
          accent: '#00c896',
          accent2: '#00a8ff',
          warn: '#f59e0b',
          danger: '#ef4444',
          muted: '#4a7a8a',
          text: '#cce8f0',
          dim: '#6b8fa0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,200,150,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0,200,150,0.6)' },
        }
      }
    },
  },
  plugins: [],
}
