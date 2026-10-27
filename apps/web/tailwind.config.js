/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#05030c',
          900: '#0a0616',
          800: '#120b23',
          700: '#1b1233',
        },
        brand: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        neon: {
          cyan: '#22d3ee',
          lime: '#a3e635',
          amber: '#fbbf24',
          rose: '#fb7185',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(139, 92, 246, 0.65)',
        'glow-sm': '0 0 24px -10px rgba(139, 92, 246, 0.8)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, rgba(5,3,12,0) 0%, rgba(5,3,12,0.85) 70%, #05030c 100%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-18px) scale(1.03)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.15)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'equalize-1': { '0%,100%': { height: '30%' }, '50%': { height: '100%' } },
        'equalize-2': { '0%,100%': { height: '80%' }, '50%': { height: '25%' } },
        'equalize-3': { '0%,100%': { height: '50%' }, '50%': { height: '95%' } },
      },
      animation: {
        float: 'float 12s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 1.8s infinite',
        'eq-1': 'equalize-1 0.9s ease-in-out infinite',
        'eq-2': 'equalize-2 1.1s ease-in-out infinite',
        'eq-3': 'equalize-3 0.7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
