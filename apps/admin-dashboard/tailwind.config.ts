import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Canvas ──────────────────────────────────────────────────
        canvas: {
          primary:   '#0A120D',
          secondary: '#0D1A10',
          elevated:  '#112016',
        },
        // ── Glass surfaces ──────────────────────────────────────────
        glass: {
          subtle:  'rgba(255,255,255,0.04)',
          light:   'rgba(255,255,255,0.08)',
          medium:  'rgba(255,255,255,0.12)',
          strong:  'rgba(255,255,255,0.18)',
          border:  'rgba(255,255,255,0.12)',
        },
        // ── Brand ───────────────────────────────────────────────────
        brand: {
          primary:   '#16A34A',
          secondary: '#15803D',
          glow:      'rgba(22,163,74,0.35)',
        },
        // ── Status ──────────────────────────────────────────────────
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error:   '#EF4444',
          info:    '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '12px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #16A34A, #15803D)',
        'canvas-gradient': 'radial-gradient(ellipse at top, #0D2010 0%, #0A120D 60%)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
