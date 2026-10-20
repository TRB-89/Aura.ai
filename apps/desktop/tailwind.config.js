/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'aura-bg': '#0A0B0E',
        'aura-surface': '#131418',
        'aura-surface-2': '#1B1C22',
        'aura-card': '#141519',
        'aura-card-elevated': '#1B1D23',
        'aura-card-hover': '#202229',
        'aura-border': 'rgba(255, 255, 255, 0.08)',
        'aura-border-beige': 'rgba(232, 213, 196, 0.16)',
        'aura-border-bronze': 'rgba(197, 155, 109, 0.25)',
        'aura-beige': '#E8D5C4',
        'aura-cream': '#F4EBE1',
        'aura-bronze': '#C59B6D',
        'aura-bronze-dark': '#9A744E',
        'aura-text': '#F8F6F2',
        'aura-text-muted': '#9C968B',
        'aura-text-dim': '#6B665D',
        'aura-success': '#4EBA88',
        'aura-error': '#E26D77',
        'aura-warning': '#E09E52',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '34px',
      },
      boxShadow: {
        'luxury': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'luxury-hover': '0 30px 60px -15px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(232, 213, 196, 0.2)',
        'glow-beige': '0 0 40px -10px rgba(232, 213, 196, 0.25)',
        'glow-bronze': '0 0 45px -10px rgba(197, 155, 109, 0.3)',
      },
      animation: {
        'orb-breathe': 'orbBreathe 5s ease-in-out infinite',
        'orb-spin-slow': 'orbSpin 16s linear infinite',
        'orb-pulse': 'orbPulse 2s ease-in-out infinite',
      },
      keyframes: {
        orbBreathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        orbSpin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
}
