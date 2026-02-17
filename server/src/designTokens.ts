/**
 * AdForge Design Tokens
 * Brand design tokens and typographic hierarchy constants for the text system.
 */

import type {
  TypographyToken,
  BrandTokenSet,
  AdIntentPreset,
  TextHierarchyConfig,
  SafeZoneSpec,
} from './types/textSystem.js';

// ── Typography Scale ──────────────────────────────────────────────

export const TYPOGRAPHY_SCALE: TextHierarchyConfig = {
  headline: {
    min: 24,
    max: 72,
    default: 48,
    lineHeight: 1.1,
    letterSpacing: -0.02,
    maxChars: 25,
  },
  subhead: {
    min: 18,
    max: 48,
    default: 28,
    lineHeight: 1.25,
    letterSpacing: -0.01,
    maxChars: 40,
  },
  body: {
    min: 14,
    max: 32,
    default: 18,
    lineHeight: 1.45,
    letterSpacing: 0,
    maxChars: 60,
  },
  cta: {
    min: 16,
    max: 36,
    default: 22,
    lineHeight: 1.2,
    letterSpacing: 0.02,
    maxChars: 20,
  },
};

// ── Color Tokens ──────────────────────────────────────────────────

export const COLOR_TOKENS: BrandTokenSet = {
  primary: '#1A1A2E',
  secondary: '#16213E',
  accent: '#E94560',
  text: '#FFFFFF',
  background: '#0F3460',
};

// ── Spacing Tokens (px) ───────────────────────────────────────────

export const SPACING_TOKENS = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ── Safe Zone Specs ───────────────────────────────────────────────

export const SAFE_ZONE_SPECS: SafeZoneSpec[] = [
  {
    format: 'feed',
    topPercent: 5,
    bottomPercent: 10,
    leftPercent: 5,
    rightPercent: 5,
    width: 1080,
    height: 1080,
  },
  {
    format: 'story',
    topPercent: 14,
    bottomPercent: 35,
    leftPercent: 5,
    rightPercent: 5,
    width: 1080,
    height: 1920,
  },
  {
    format: 'reel',
    topPercent: 10,
    bottomPercent: 35,
    leftPercent: 5,
    rightPercent: 15,
    width: 1080,
    height: 1920,
  },
];

// ── Ad Intent Presets ─────────────────────────────────────────────

export const AD_INTENT_PRESETS: Record<string, AdIntentPreset> = {
  conversion: {
    intent: 'conversion',
    description: 'Optimized for direct response — large CTA, concise headline',
    ctaEmphasis: 'high',
    typography: {
      headline: { default: 42, maxChars: 20 },
      subhead: { default: 24 },
      body: { default: 16, maxChars: 45 },
      cta: { default: 28, min: 20 },
    },
  },
  awareness: {
    intent: 'awareness',
    description: 'Brand storytelling — prominent headline, subtle CTA',
    ctaEmphasis: 'low',
    typography: {
      headline: { default: 56, max: 72 },
      subhead: { default: 32 },
      body: { default: 20 },
      cta: { default: 18 },
    },
  },
  retargeting: {
    intent: 'retargeting',
    description: 'Re-engagement — balanced hierarchy, medium CTA urgency',
    ctaEmphasis: 'medium',
    typography: {
      headline: { default: 44 },
      subhead: { default: 26 },
      body: { default: 18 },
      cta: { default: 24 },
    },
  },
};

// ── Font Size Clamp Helpers ───────────────────────────────────────

/** Mobile-first font size clamp constants (all values in px) */
export const FONT_SIZE_CLAMPS = {
  absoluteMin: 14,
  absoluteMax: 96,
  /** Clamp a font size within a token's range */
  clamp(size: number, token: TypographyToken): number {
    return Math.max(token.min, Math.min(token.max, size));
  },
} as const;
