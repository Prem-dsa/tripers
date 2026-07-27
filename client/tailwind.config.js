/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Primary indigo brand ──────────────────────
        primary: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
          800: '#312E81',
          900: '#1E1B4B',
        },
        // ── Secondary cyan ──────────────────────────
        secondary: {
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
        },
        // ── Accent amber ─────────────────────────────
        accent: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        // ── Slate text scale ─────────────────────────
        ink: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // ── Surface / backgrounds ─────────────────────
        surface: {
          DEFAULT: '#FFFFFF',
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
        },
        // ── Semantic greens / warnings / errors ───────
        success: { DEFAULT: '#22C55E', light: '#DCFCE7', text: '#15803D' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', text: '#B45309' },
        danger:  { DEFAULT: '#EF4444', light: '#FEE2E2', text: '#DC2626' },
        green: { 500: '#22C55E', 600: '#16A34A' },

        // ── Legacy tokens (kept for compatibility) ────
        dark: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          350: '#94A3B8',
          400: '#64748B',
          450: '#475569',
          500: '#334155',
          600: '#1E293B',
          700: '#0F172A',
          800: '#0F172A',
          900: '#0F172A',
          950: '#020617',
        },
        border: {
          DEFAULT: '#E2E8F0',
          focus: '#4F46E5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card:        '0 1px 3px rgba(79,70,229,0.04), 0 4px 16px rgba(79,70,229,0.06)',
        'card-hover':'0 8px 32px rgba(79,70,229,0.16), 0 2px 8px rgba(79,70,229,0.08)',
        glow:        '0 0 24px rgba(79,70,229,0.28)',
        'glow-sm':   '0 0 12px rgba(79,70,229,0.18)',
        'glow-xs':   '0 0 6px rgba(79,70,229,0.12)',
        float:       '0 12px 40px rgba(79,70,229,0.12), 0 2px 8px rgba(79,70,229,0.06)',
        modal:       '0 24px 64px rgba(79,70,229,0.16)',
        inner:       'inset 0 1px 3px rgba(79,70,229,0.08)',
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
        'gradient-primary':  'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
        'gradient-accent':   'linear-gradient(135deg, #4F46E5 0%, #F59E0B 100%)',
        'gradient-hero':     'linear-gradient(135deg, #4F46E5 0%, #06B6D4 50%, #F59E0B 100%)',
        'gradient-surface':  'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        'shimmer-light':     'linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)',
      },
    },
  },
  plugins: [],
};
