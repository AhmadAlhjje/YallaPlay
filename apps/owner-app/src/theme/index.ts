// Same design language as user-app — Glassmorphism + dark navy
export const Colors = {
  background: {
    primary:  '#0A0E1A',
    secondary: '#0F1428',
    elevated: '#141830',
  },
  glass: {
    subtle:      'rgba(255,255,255,0.04)',
    light:       'rgba(255,255,255,0.08)',
    medium:      'rgba(255,255,255,0.12)',
    strong:      'rgba(255,255,255,0.18)',
    border:      'rgba(255,255,255,0.12)',
    borderHover: 'rgba(255,255,255,0.22)',
    highlight:   'rgba(255,255,255,0.06)',
  },
  brand: {
    primary:  '#4F46E5',
    secondary:'#7C3AED',
    gradient: ['#4F46E5', '#7C3AED'] as const,
    glow:     'rgba(79,70,229,0.35)',
  },
  success:   '#10B981',
  successBg: 'rgba(16,185,129,0.15)',
  warning:   '#F59E0B',
  warningBg: 'rgba(245,158,11,0.15)',
  error:     '#EF4444',
  errorBg:   'rgba(239,68,68,0.15)',
  info:      '#3B82F6',
  text: {
    primary:   '#F9FAFB',
    secondary: '#9CA3AF',
    tertiary:  '#6B7280',
    brand:     '#818CF8',
  },
  booking: {
    pending:   '#F59E0B',
    confirmed: '#10B981',
    completed: '#3B82F6',
    cancelled: '#EF4444',
  },
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, huge: 32,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
} as const;

export const Typography = {
  displayLg: { fontSize: 36, fontWeight: '800' as const, writingDirection: 'rtl' as const },
  h1:        { fontSize: 28, fontWeight: '700' as const, writingDirection: 'rtl' as const },
  h2:        { fontSize: 22, fontWeight: '700' as const, writingDirection: 'rtl' as const },
  h3:        { fontSize: 18, fontWeight: '600' as const, writingDirection: 'rtl' as const },
  bodyLg:    { fontSize: 17, fontWeight: '400' as const, writingDirection: 'rtl' as const },
  bodyMd:    { fontSize: 15, fontWeight: '400' as const, writingDirection: 'rtl' as const },
  bodySm:    { fontSize: 13, fontWeight: '400' as const, writingDirection: 'rtl' as const },
  labelLg:   { fontSize: 16, fontWeight: '600' as const, writingDirection: 'rtl' as const },
  labelMd:   { fontSize: 14, fontWeight: '600' as const, writingDirection: 'rtl' as const },
  labelSm:   { fontSize: 12, fontWeight: '600' as const, writingDirection: 'rtl' as const },
  numericLg: { fontSize: 32, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as const },
  numericMd: { fontSize: 20, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as const },
  numericSm: { fontSize: 14, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as const },
};
