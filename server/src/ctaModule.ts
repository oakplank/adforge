/**
 * CTA Module — Reusable CTA configuration generator with token-based styling.
 * Generates CTA configs that meet WCAG AA contrast and minimum touch targets.
 */

import type { BrandTokenSet, AdIntent } from './types/textSystem.js';
import { CHAR_LIMITS } from './copyEngine.js';
import { AD_INTENT_PRESETS, TYPOGRAPHY_SCALE, SPACING_TOKENS } from './designTokens.js';

export type AdFormat = 'feed' | 'story' | 'reel';

export interface CtaConfig {
  text: string;
  fontSize: number;
  padding: { x: number; y: number };
  borderRadius: number;
  bgColor: string;
  textColor: string;
  contrastRatio: number;
  position: { x: string; y: string };
  minWidth: number;
  minHeight: number;
}

// ── Color utilities ───────────────────────────────────────────────

/** Parse hex color to RGB */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Relative luminance per WCAG 2.1 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Format-specific sizing ────────────────────────────────────────

const FORMAT_SCALING: Record<AdFormat, { fontScale: number; paddingScale: number }> = {
  feed: { fontScale: 1.0, paddingScale: 1.0 },
  story: { fontScale: 1.2, paddingScale: 1.3 },
  reel: { fontScale: 1.15, paddingScale: 1.2 },
};

const FORMAT_POSITIONS: Record<AdFormat, { x: string; y: string }> = {
  feed: { x: 'center', y: '85%' },
  story: { x: 'center', y: '55%' },
  reel: { x: 'left-10%', y: '55%' },
};

const MIN_TOUCH_TARGET = 44; // CSS px

// ── Main generator ────────────────────────────────────────────────

/**
 * Generate a CTA configuration with brand tokens, intent, and format awareness.
 * Ensures WCAG AA contrast (>= 4.5) and minimum 44px touch targets.
 */
export function generateCtaConfig(
  text: string,
  brandTokens: BrandTokenSet,
  intent: AdIntent,
  format: AdFormat,
): CtaConfig {
  // Truncate text to CHAR_LIMITS.cta
  const ctaText = text.length > CHAR_LIMITS.cta ? text.slice(0, CHAR_LIMITS.cta) : text;

  const preset = AD_INTENT_PRESETS[intent];
  const ctaTypo = TYPOGRAPHY_SCALE.cta;
  const scaling = FORMAT_SCALING[format];

  // Resolve font size from intent preset with format scaling
  const baseSize = preset.typography.cta.default ?? ctaTypo.default;
  const minSize = preset.typography.cta.min ?? ctaTypo.min;
  const maxSize = ctaTypo.max;
  const scaledSize = Math.round(baseSize * scaling.fontScale);
  const fontSize = Math.max(minSize, Math.min(maxSize, scaledSize));

  // Padding based on emphasis
  const emphasisMultiplier = preset.ctaEmphasis === 'high' ? 1.4 : preset.ctaEmphasis === 'medium' ? 1.1 : 0.9;
  const basePaddingX = SPACING_TOKENS.lg * emphasisMultiplier * scaling.paddingScale;
  const basePaddingY = SPACING_TOKENS.md * emphasisMultiplier * scaling.paddingScale;
  const paddingX = Math.round(basePaddingX);
  const paddingY = Math.round(basePaddingY);

  // Ensure minimum touch target (height = fontSize * lineHeight + 2*paddingY)
  const estimatedHeight = fontSize * ctaTypo.lineHeight + paddingY * 2;
  const finalPaddingY = estimatedHeight >= MIN_TOUCH_TARGET
    ? paddingY
    : Math.ceil((MIN_TOUCH_TARGET - fontSize * ctaTypo.lineHeight) / 2);

  // Ensure min width
  const estimatedWidth = fontSize * ctaText.length * 0.6 + paddingX * 2;
  const finalPaddingX = estimatedWidth >= MIN_TOUCH_TARGET
    ? paddingX
    : Math.ceil((MIN_TOUCH_TARGET - fontSize * ctaText.length * 0.6) / 2);

  // Colors: use accent as bg, text as fg. Ensure contrast >= 4.5
  let bgColor = brandTokens.accent;
  let textColor = brandTokens.text;
  let ratio = contrastRatio(textColor, bgColor);

  // If contrast insufficient, try white then black
  if (ratio < 4.5) {
    textColor = '#FFFFFF';
    ratio = contrastRatio(textColor, bgColor);
  }
  if (ratio < 4.5) {
    textColor = '#000000';
    ratio = contrastRatio(textColor, bgColor);
  }
  // If still insufficient, swap to high-contrast pair
  if (ratio < 4.5) {
    bgColor = '#1A1A2E';
    textColor = '#FFFFFF';
    ratio = contrastRatio(textColor, bgColor);
  }

  const borderRadius = preset.ctaEmphasis === 'high' ? 8 : preset.ctaEmphasis === 'medium' ? 6 : 4;

  const finalHeight = fontSize * ctaTypo.lineHeight + finalPaddingY * 2;
  const finalWidth = Math.max(MIN_TOUCH_TARGET, fontSize * ctaText.length * 0.6 + finalPaddingX * 2);

  return {
    text: ctaText,
    fontSize,
    padding: { x: finalPaddingX, y: finalPaddingY },
    borderRadius,
    bgColor,
    textColor,
    contrastRatio: Math.round(ratio * 100) / 100,
    position: FORMAT_POSITIONS[format],
    minWidth: Math.round(finalWidth),
    minHeight: Math.round(finalHeight),
  };
}
