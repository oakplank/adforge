/**
 * Intent Presets Module
 * Configurable presets for conversion, awareness, and retargeting ad intents.
 * Provides getPresetForIntent() and applyPresetToLayout() functions.
 */

import type { AdIntent, AdIntentPreset } from './types/textSystem.js';
import { AD_INTENT_PRESETS, TYPOGRAPHY_SCALE } from './designTokens.js';
import type { LayoutOutput } from './layoutEngine.js';

/** CTA prominence numeric mapping for comparison */
export const CTA_PROMINENCE: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/** Extended preset config with additional properties for full intent control */
export interface IntentPresetConfig extends AdIntentPreset {
  /** Headline weight (font-weight CSS value) */
  headlineWeight: number;
  /** Headline size ratio relative to base (1.0 = default) */
  headlineSizeRatio: number;
  /** Subhead weight */
  subheadWeight: number;
  /** Subhead size ratio relative to base */
  subheadSizeRatio: number;
  /** CTA prominence numeric level (1-3) */
  ctaProminenceLevel: number;
  /** Preferred headline formulas/patterns */
  preferredHeadlineFormulas: string[];
  /** Color emphasis strategy */
  colorEmphasisStrategy: 'cta-accent' | 'headline-accent' | 'balanced';
}

const EXTENDED_PRESETS: Record<AdIntent, Omit<IntentPresetConfig, keyof AdIntentPreset>> = {
  conversion: {
    headlineWeight: 800,
    headlineSizeRatio: 0.875,
    subheadWeight: 400,
    subheadSizeRatio: 0.85,
    ctaProminenceLevel: 3,
    preferredHeadlineFormulas: ['urgency', 'benefit-driven', 'limited-time'],
    colorEmphasisStrategy: 'cta-accent',
  },
  awareness: {
    headlineWeight: 700,
    headlineSizeRatio: 1.17,
    subheadWeight: 500,
    subheadSizeRatio: 1.14,
    ctaProminenceLevel: 1,
    preferredHeadlineFormulas: ['brand-story', 'aspirational', 'curiosity'],
    colorEmphasisStrategy: 'headline-accent',
  },
  retargeting: {
    headlineWeight: 700,
    headlineSizeRatio: 0.92,
    subheadWeight: 400,
    subheadSizeRatio: 0.93,
    ctaProminenceLevel: 2,
    preferredHeadlineFormulas: ['social-proof', 'reminder', 'fomo'],
    colorEmphasisStrategy: 'balanced',
  },
};

/**
 * Get the full preset configuration for a given ad intent.
 */
export function getPresetForIntent(intent: AdIntent): IntentPresetConfig {
  const base = AD_INTENT_PRESETS[intent];
  if (!base) {
    throw new Error(`Unknown ad intent: ${intent}`);
  }
  const extended = EXTENDED_PRESETS[intent];
  return { ...base, ...extended };
}

/**
 * Apply a preset to an existing layout, adjusting font sizes and positions
 * based on the intent's typography overrides and hierarchy ratios.
 */
export function applyPresetToLayout(
  layout: LayoutOutput,
  preset: IntentPresetConfig,
): LayoutOutput {
  const result = { ...layout };

  // Apply headline sizing
  const headlineBase = preset.typography.headline.default ?? TYPOGRAPHY_SCALE.headline.default;
  const headlineFontSize = Math.round(headlineBase * preset.headlineSizeRatio);
  result.headline = {
    ...layout.headline,
    fontSize: headlineFontSize,
  };

  // Apply subhead sizing
  const subheadBase = preset.typography.subhead.default ?? TYPOGRAPHY_SCALE.subhead.default;
  const subheadFontSize = Math.round(subheadBase * preset.subheadSizeRatio);
  result.subhead = {
    ...layout.subhead,
    fontSize: subheadFontSize,
  };

  // Apply CTA sizing based on prominence
  const ctaBase = preset.typography.cta.default ?? TYPOGRAPHY_SCALE.cta.default;
  const ctaScale = 1 + (preset.ctaProminenceLevel - 1) * 0.15; // 1.0, 1.15, 1.3
  const ctaFontSize = Math.round(ctaBase * ctaScale);
  result.cta = {
    ...layout.cta,
    fontSize: ctaFontSize,
  };

  return result;
}
