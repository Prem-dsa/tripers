/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EBF3FE',
          100: '#D5E6FD',
          200: '#ABC9FB',
          300: '#81ABF9',
          400: '#5A8EF7',
          500: '#3B82F6',
          600: '#2063E2',
          700: '#174EB3',
          800: '#113A87',
          900: '#0B275B',
        },
        secondary: {
          DEFAULT: '#64D2FF',
          300: '#9CE3FF',
          400: '#7CDAFF',
          500: '#64D2FF',
          600: '#33C4FF',
          700: '#00AEEF',
        },
        accent: {
          DEFAULT: '#FF7A18',
          300: '#FFB17A',
          400: '#FF974C',
          500: '#FF7A18',
          600: '#E66100',
        },
        success: { DEFAULT: '#34C759', light: '#E8F8EC', text: '#248A3D' },
        danger: { DEFAULT: '#FF453A', light: '#FFEBEA', text: '#C7241B' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', text: '#B45309' },
        
        // Background and surface
        surface: {
          DEFAULT: '#FFFFFF',
          50: '#F7FBFF',
          100: '#F1F5F9',
        },
        glass: {
          card: 'rgba(255, 255, 255, 0.18)',
          border: 'rgba(255, 255, 255, 0.28)',
          strong: 'rgba(255, 255, 255, 0.45)',
        }
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"SF Pro Display"', '"SF Pro Text"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 32px rgba(59, 130, 246, 0.08), 0 2px 8px rgba(59, 130, 246, 0.04)',
        'card-hover': '0 16px 48px rgba(59, 130, 246, 0.16), 0 4px 12px rgba(59, 130, 246, 0.08)',
        glow: '0 0 30px rgba(100, 210, 255, 0.4)',
        'glow-sm': '0 0 15px rgba(100, 210, 255, 0.25)',
        float: '0 20px 50px rgba(0, 0, 0, 0.1)',
        glass: 'inset 0 1px 1px rgba(255, 255, 255, 0.6), 0 8px 32px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        liquid: '30px',
        acrylic: '40px',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '1.875rem',
        '5xl': '2.25rem', // 36px
        'card': '30px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'spring-hover': 'springHover 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        springHover: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1.03)' },
        },
      },
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
        'gradient-hero': 'linear-gradient(135deg, #3B82F6 0%, #64D2FF 100%)',
      },
    },
  },
  plugins: [],
};
