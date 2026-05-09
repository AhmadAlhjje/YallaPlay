export const Colors = {
  // ── Canvas ─────────────────────────────────────────────────────────────────
  // Rich deep navy — all screens sit on this
  background: {
    primary: '#0A0E1A',
    secondary: '#0F1428',
    elevated: '#141830',
  },

  // ── Glass surfaces ─────────────────────────────────────────────────────────
  glass: {
    // Card backgrounds — BlurView + these overlays
    subtle:    'rgba(255, 255, 255, 0.04)',
    light:     'rgba(255, 255, 255, 0.08)',
    medium:    'rgba(255, 255, 255, 0.12)',
    strong:    'rgba(255, 255, 255, 0.18)',
    // Border — the frosted edge
    border:    'rgba(255, 255, 255, 0.12)',
    borderHover: 'rgba(255, 255, 255, 0.22)',
    // Shimmer highlight — top edge of card
    highlight: 'rgba(255, 255, 255, 0.06)',
  },

  // ── Brand ──────────────────────────────────────────────────────────────────
  brand: {
    primary:   '#4F46E5', // Indigo
    secondary: '#7C3AED', // Violet
    gradient:  ['#4F46E5', '#7C3AED'] as const,
    glow:      'rgba(79, 70, 229, 0.35)',
  },

  // ── Semantic ───────────────────────────────────────────────────────────────
  success:   '#10B981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning:   '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  error:     '#EF4444',
  errorBg:   'rgba(239, 68, 68, 0.15)',
  info:      '#3B82F6',

  // ── Slot status colors ─────────────────────────────────────────────────────
  slot: {
    available: '#10B981',
    availableBg: 'rgba(16, 185, 129, 0.15)',
    booked:    '#EF4444',
    bookedBg:  'rgba(239, 68, 68, 0.15)',
    pending:   '#F59E0B',
    pendingBg: 'rgba(245, 158, 11, 0.15)',
    closed:    '#374151',
    closedBg:  'rgba(55, 65, 81, 0.15)',
  },

  // ── Sport accent colors ────────────────────────────────────────────────────
  sport: {
    football:   '#10B981',
    basketball: '#F59E0B',
    tennis:     '#FBBF24',
    volleyball: '#60A5FA',
    padel:      '#A78BFA',
    squash:     '#F87171',
    badminton:  '#34D399',
    swimming:   '#38BDF8',
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary:   '#F9FAFB',
    secondary: '#9CA3AF',
    tertiary:  '#6B7280',
    inverse:   '#111827',
    brand:     '#818CF8',
  },
} as const;

export type ColorKey = keyof typeof Colors;
