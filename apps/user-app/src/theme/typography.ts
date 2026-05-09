import { Platform, TextStyle } from 'react-native';

// Arabic-aware font stack — uses system fonts to avoid bundling issues
const arabicFont = Platform.select({ ios: 'System', android: 'sans-serif' });

export const Typography = {
  // Display — hero text, large numbers
  displayLg: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
    writingDirection: 'rtl',
  } as TextStyle,
  displayMd: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.3,
    writingDirection: 'rtl',
  } as TextStyle,

  // Headings
  h1: { fontSize: 24, fontWeight: '700', lineHeight: 32, writingDirection: 'rtl' } as TextStyle,
  h2: { fontSize: 20, fontWeight: '600', lineHeight: 28, writingDirection: 'rtl' } as TextStyle,
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 26, writingDirection: 'rtl' } as TextStyle,

  // Body
  bodyLg: { fontSize: 16, fontWeight: '400', lineHeight: 24, writingDirection: 'rtl' } as TextStyle,
  bodyMd: { fontSize: 14, fontWeight: '400', lineHeight: 22, writingDirection: 'rtl' } as TextStyle,
  bodySm: { fontSize: 12, fontWeight: '400', lineHeight: 18, writingDirection: 'rtl' } as TextStyle,

  // Labels
  labelLg: { fontSize: 14, fontWeight: '600', lineHeight: 20, writingDirection: 'rtl' } as TextStyle,
  labelMd: { fontSize: 12, fontWeight: '600', lineHeight: 16, writingDirection: 'rtl' } as TextStyle,
  labelSm: { fontSize: 11, fontWeight: '500', lineHeight: 14, writingDirection: 'rtl' } as TextStyle,

  // Numeric — LTR always (prices, times)
  numericLg: { fontSize: 24, fontWeight: '700', lineHeight: 32, fontVariant: ['tabular-nums'] } as TextStyle,
  numericMd: { fontSize: 16, fontWeight: '600', lineHeight: 22, fontVariant: ['tabular-nums'] } as TextStyle,
  numericSm: { fontSize: 13, fontWeight: '500', lineHeight: 18, fontVariant: ['tabular-nums'] } as TextStyle,
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  sm:   8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  full: 9999,
} as const;
