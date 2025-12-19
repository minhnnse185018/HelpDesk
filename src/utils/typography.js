/**
 * Typography System - Centralized font size and weight constants
 * Use these constants instead of hardcoded values for consistency
 */

export const FONT_SIZES = {
  xs: '0.7rem',      // 11.2px - Small labels, badges, status indicators
  sm: '0.75rem',     // 12px - Secondary text, captions, metadata
  base: '0.875rem', // 14px - Body text, default size
  md: '0.9rem',      // 14.4px - Slightly emphasized text
  lg: '1rem',       // 16px - Section titles, emphasized content
  xl: '1.25rem',    // 20px - Page subtitles, card titles
  '2xl': '1.35rem', // 21.6px - Page titles
  '3xl': '1.875rem', // 30px - Large headings
  '4xl': '2rem',    // 32px - Hero headings
};

/**
 * Map common hardcoded font sizes to standardized sizes
 * Use this to convert existing hardcoded values
 */
export const FONT_SIZE_MAP = {
  '0.625rem': FONT_SIZES.xs,
  '0.65rem': FONT_SIZES.xs,
  '0.7rem': FONT_SIZES.xs,
  '0.75rem': FONT_SIZES.sm,
  '0.8rem': FONT_SIZES.base,
  '0.82rem': FONT_SIZES.base,
  '0.85rem': FONT_SIZES.base,
  '0.875rem': FONT_SIZES.base,
  '0.9rem': FONT_SIZES.md,
  '0.95rem': FONT_SIZES.md,
  '1rem': FONT_SIZES.lg,
  '1.05rem': FONT_SIZES.lg,
  '1.125rem': FONT_SIZES.lg,
  '1.25rem': FONT_SIZES.xl,
  '1.35rem': FONT_SIZES['2xl'],
  '1.4rem': '1.4rem', // KPI values - keep as is
  '1.5rem': FONT_SIZES.xl,
  '1.875rem': FONT_SIZES['3xl'],
  '2rem': FONT_SIZES['4xl'],
  '3rem': '3rem', // Emoji/icons - keep as is
};

export const FONT_WEIGHTS = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const LINE_HEIGHTS = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

/**
 * Helper function to get consistent typography styles
 * @param {string} size - Font size key (xs, sm, base, etc.)
 * @param {number} weight - Font weight (400, 500, 600, 700)
 * @param {number} lineHeight - Line height multiplier
 * @returns {object} Style object with typography properties
 */
export const getTypographyStyle = (size = 'base', weight = 400, lineHeight = 1.5) => ({
  fontSize: FONT_SIZES[size] || FONT_SIZES.base,
  fontWeight: weight,
  lineHeight: lineHeight,
});

/**
 * Helper to get font size value for inline styles
 * Since inline styles can't use CSS variables, use this helper
 * @param {string} size - Font size key (xs, sm, base, etc.)
 * @returns {string} Font size value
 */
export const getFontSize = (size = 'base') => {
  return FONT_SIZES[size] || FONT_SIZES.base;
};

/**
 * Helper to get font weight value for inline styles
 * @param {string|number} weight - Font weight key or number
 * @returns {number} Font weight value
 */
export const getFontWeight = (weight = 'normal') => {
  if (typeof weight === 'number') return weight;
  return FONT_WEIGHTS[weight] || FONT_WEIGHTS.normal;
};

/**
 * Common typography presets for different use cases
 */
export const TYPOGRAPHY = {
  // Headings
  h1: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.tight,
  },
  h2: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.tight,
  },
  h3: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.normal,
  },
  h4: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.normal,
  },

  // Body text
  body: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
  },
  bodySmall: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
  },
  bodyLarge: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
  },

  // UI Elements
  button: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.normal,
  },
  buttonSmall: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.normal,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: LINE_HEIGHTS.normal,
  },
  caption: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
  },
  badge: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.tight,
  },
};

