/**
 * Font Styles Helper - For use in inline styles
 * Since inline styles can't use CSS variables, use these constants
 */

import { FONT_SIZES, FONT_WEIGHTS } from './typography';

// Direct access to font sizes for inline styles
export const fontSize = {
  xs: FONT_SIZES.xs,
  sm: FONT_SIZES.sm,
  base: FONT_SIZES.base,
  md: FONT_SIZES.md,
  lg: FONT_SIZES.lg,
  xl: FONT_SIZES.xl,
  '2xl': FONT_SIZES['2xl'],
  '3xl': FONT_SIZES['3xl'],
  '4xl': FONT_SIZES['4xl'],
};

// Direct access to font weights for inline styles
export const fontWeight = {
  normal: FONT_WEIGHTS.normal,
  medium: FONT_WEIGHTS.medium,
  semibold: FONT_WEIGHTS.semibold,
  bold: FONT_WEIGHTS.bold,
};

// Common inline style presets
export const textStyles = {
  h1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 1.25,
  },
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: 1.25,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: 1.5,
  },
  h4: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: 1.5,
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: 1.5,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: 1.5,
  },
  badge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: 1.25,
  },
  button: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: 1.5,
  },
};

