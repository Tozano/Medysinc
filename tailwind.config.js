/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#060d1f',
          800: '#0a1628',
          700: '#0f1f3d',
          600: '#1a2f5a',
          500: '#243d76',
        },
        medical: {
          blue: '#00b4d8',
          teal: '#48cae4',
          light: '#90e0ef',
          pale: '#caf0f8',
        },
        status: {
          taken: '#06d6a0',
          upcoming: '#ffd166',
          missed: '#ef476f',
          locked: '#4a5568',
          ready: '#00b4d8',
        },
        panel: '#111827',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 180, 216, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 180, 216, 0.9), 0 0 40px rgba(0, 180, 216, 0.4)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
