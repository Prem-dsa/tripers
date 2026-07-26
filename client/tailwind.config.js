/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Primary purple brand ──────────────────────
        primary: {
          50:  '#F3F0FF',
          100: '#EDE8FF',
          200: '#D9D0FF',
          300: '#BDB0FF',
          400: '#9D88FF',
          500: '#6D4AFF',
          600: '#5A38E8',
          700: '#472AC8',
          800: '#341FA0',
          900: '#1E1B4B',
        },
        // ── Secondary purple ──────────────────────────
        secondary: {
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        // ── Accent purple ─────────────────────────────
        accent: {
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
        },
        // ── Indigo text scale ─────────────────────────
        ink: {
          50:  '#F8F7FF',
          100: '#F0EDFF',
          200: '#E2DAFF',
          300: '#C4B8FF',
          400: '#9B8ECA',
          500: '#6B5CA5',
          600: '#4B3D85',
          700: '#2D2066',
          800: '#1E1B4B',
          900: '#13102F',
        },
        // ── Surface / backgrounds ─────────────────────
        surface: {
          DEFAULT: '#FFFFFF',
          50:  '#F8F5FF',
          100: '#F3F0FF',
          200: '#EDE8FF',
          300: '#E9E2FF',
          400: '#D0C6FF',
          500: '#B0A0E8',
        },
        // ── Semantic greens / warnings / errors ───────
        success: { DEFAULT: '#22C55E', light: '#DCFCE7', text: '#15803D' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', text: '#B45309' },
        danger:  { DEFAULT: '#EF4444', light: '#FEE2E2', text: '#DC2626' },

        // ── Legacy tokens (kept for compatibility) ────
        dark: {
          50:  '#F8F7FF',
          100: '#F0EDFF',
          200: '#E2DAFF',
          300: '#9B8ECA',
          350: '#7D6DB0',
          400: '#6B5CA5',
          450: '#5A4D90',
          500: '#4B3D85',
          600: '#3B2E70',
          700: '#2D2066',
          800: '#1E1B4B',
          900: '#13102F',
          950: '#0D0B20',
        },
        border: {
          DEFAULT: '#E9E2FF',
          focus: '#6D4AFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card:        '0 1px 3px rgba(109,74,255,0.04), 0 4px 16px rgba(109,74,255,0.06)',
        'card-hover':'0 8px 32px rgba(109,74,255,0.16), 0 2px 8px rgba(109,74,255,0.08)',
        glow:        '0 0 24px rgba(109,74,255,0.28)',
        'glow-sm':   '0 0 12px rgba(109,74,255,0.18)',
        'glow-xs':   '0 0 6px rgba(109,74,255,0.12)',
        float:       '0 12px 40px rgba(109,74,255,0.12), 0 2px 8px rgba(109,74,255,0.06)',
        modal:       '0 24px 64px rgba(109,74,255,0.16)',
        inner:       'inset 0 1px 3px rgba(109,74,255,0.08)',
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in':       'fadeIn 0.35s ease-out',
        'slide-up':      'slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right':'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer:         'shimmer 1.8s linear infinite',
        float:           'float 6s ease-in-out infinite',
        'pulse-slow':    'pulse 3s ease-in-out infinite',
        'spin-slow':     'spin 3s linear infinite',
        'bounce-slow':   'bounce 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float:        { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      backgroundImage: {
        'gradient-primary':  'linear-gradient(135deg, #6D4AFF 0%, #8B5CF6 100%)',
        'gradient-accent':   'linear-gradient(135deg, #6D4AFF 0%, #A855F7 100%)',
        'gradient-hero':     'linear-gradient(135deg, #6D4AFF 0%, #8B5CF6 50%, #A855F7 100%)',
        'gradient-surface':  'linear-gradient(180deg, #FFFFFF 0%, #F8F5FF 100%)',
        'shimmer-light':     'linear-gradient(90deg, #F3F0FF 0%, #E9E2FF 50%, #F3F0FF 100%)',
      },
    },
  },
  plugins: [],
};
