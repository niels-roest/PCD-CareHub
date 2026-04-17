/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.njk',
    './js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#05081a',
          900: '#0a1628',
          800: '#0f1f3d',
          700: '#152a4a',
          600: '#1a3558',
        },
        brand: {
          blue: '#046bd2',
          'blue-dark': '#045cb4',
          'blue-light': '#60a5fa',
          light: '#f4f6f8',
        },
        accent: {
          indigo: '#6366f1',
          violet: '#7c3aed',
          sky: '#3b82f6',
          pink: '#f472b6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'grid-white': 'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
        'gradient-brand': 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
        'gradient-cta': 'linear-gradient(90deg, #046bd2 0%, #3b82f6 50%, #6366f1 100%)',
      },
      boxShadow: {
        'glow-blue': '0 30px 80px -20px rgba(4, 107, 210, 0.35)',
        'glow-violet': '0 30px 80px -20px rgba(124, 58, 237, 0.35)',
      },
      keyframes: {
        'orb-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, -10px) scale(1.05)' },
        },
      },
      animation: {
        'orb-drift': 'orb-drift 14s ease-in-out infinite',
      },
    }
  },
  plugins: [],
}
