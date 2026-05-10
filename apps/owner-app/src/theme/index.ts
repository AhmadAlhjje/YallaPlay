export const Colors = {
  brand: {
    primary:   '#16A34A',
    secondary: '#15803D',
    dark:      '#14532D',
    light:     'rgba(22,163,74,0.08)',
    border:    '#16A34A',
    glow:      'rgba(22,163,74,0.2)',
    gradient:  ['#16A34A', '#15803D'] as const,
  },
  background: {
    primary:   '#FFFFFF',
    secondary: '#F9FAFB',
    elevated:  '#F3F4F6',
  },
  glass: {
    subtle:      'rgba(0,0,0,0.03)',
    light:       'rgba(0,0,0,0.05)',
    medium:      'rgba(0,0,0,0.08)',
    strong:      'rgba(0,0,0,0.12)',
    border:      '#E5E7EB',
    borderHover: '#D1D5DB',
    highlight:   'rgba(22,163,74,0.06)',
  },
  text: {
    primary:   '#111827',
    secondary: '#374151',
    tertiary:  '#9CA3AF',
    brand:     '#16A34A',
  },
  border: {
    default: '#E5E7EB',
    focus:   '#16A34A',
  },
  // Top-level status shortcuts (used by screens)
  success:   '#10B981',
  successBg: 'rgba(16,185,129,0.12)',
  warning:   '#F59E0B',
  warningBg: 'rgba(245,158,11,0.12)',
  error:     '#EF4444',
  errorBg:   'rgba(239,68,68,0.12)',
  info:      '#3B82F6',
  infoBg:    'rgba(59,130,246,0.12)',

  status: {
    success:   '#10B981',
    successBg: 'rgba(16,185,129,0.12)',
    warning:   '#F59E0B',
    warningBg: 'rgba(245,158,11,0.12)',
    error:     '#EF4444',
    errorBg:   'rgba(239,68,68,0.12)',
    info:      '#3B82F6',
    infoBg:    'rgba(59,130,246,0.12)',
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
  displayLg: { fontSize: 36, fontWeight: '800' as const },
  h1:        { fontSize: 28, fontWeight: '700' as const },
  h2:        { fontSize: 22, fontWeight: '700' as const },
  h3:        { fontSize: 18, fontWeight: '600' as const },
  bodyLg:    { fontSize: 17, fontWeight: '400' as const },
  bodyMd:    { fontSize: 15, fontWeight: '400' as const },
  bodySm:    { fontSize: 13, fontWeight: '400' as const },
  labelLg:   { fontSize: 16, fontWeight: '600' as const },
  labelMd:   { fontSize: 14, fontWeight: '600' as const },
  labelSm:   { fontSize: 12, fontWeight: '600' as const },
  numericLg: { fontSize: 32, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as const },
  numericMd: { fontSize: 20, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as const },
  numericSm: { fontSize: 14, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as const },
};
