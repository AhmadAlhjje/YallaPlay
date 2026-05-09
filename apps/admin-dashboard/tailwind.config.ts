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
          primary:   '#0A0E1A',
          secondary: '#0F1428',
          elevated:  '#141830',
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
          primary:   '#4F46E5',
          secondary: '#7C3AED',
          glow:      'rgba(79,70,229,0.35)',
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '12px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        'canvas-gradient': 'radial-gradient(ellipse at top, #0D1535 0%, #0A0E1A 60%)',
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
