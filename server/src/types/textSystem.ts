/**
 * Text System Types for AdForge
 * Shared interfaces for the brand design token system and typographic hierarchy.
 */

/** A single typography token defining size constraints and text metrics */
export interface TypographyToken {
  /** Minimum font size in px (mobile-first, >= 14) */
  min: number;
  /** Maximum font size in px (<= 96) */
  max: number;
  /** Default font size in px */
  default: number;
  /** Line height multiplier */
  lineHeight: number;
  /** Letter spacing in em */
  letterSpacing: number;
  /** Maximum characters per line for readability */
  maxChars: number;
}

/** Brand color token set */
export interface BrandTokenSet {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

/** Ad intent preset type */
export type AdIntent = 'conversion' | 'awareness' | 'retargeting';

/** Configuration for an ad intent preset */
export interface AdIntentPreset {
  intent: AdIntent;
  /** Typography overrides per hierarchy level */
  typography: {
    headline: Partial<TypographyToken>;
    subhead: Partial<TypographyToken>;
    body: Partial<TypographyToken>;
    cta: Partial<TypographyToken>;
  };
  /** CTA style emphasis (e.g., larger CTA for conversion) */
  ctaEmphasis: 'high' | 'medium' | 'low';
  /** Description of the preset's purpose */
  description: string;
}

/** Full text hierarchy configuration */
export interface TextHierarchyConfig {
  headline: TypographyToken;
  subhead: TypographyToken;
  body: TypographyToken;
  cta: TypographyToken;
}

/** Safe zone specification for a given ad format */
export interface SafeZoneSpec {
  /** Format name (e.g., 'story', 'feed', 'reel') */
  format: string;
  /** Top safe zone as percentage of height */
  topPercent: number;
  /** Bottom safe zone as percentage of height */
  bottomPercent: number;
  /** Left safe zone as percentage of width */
  leftPercent: number;
  /** Right safe zone as percentage of width */
  rightPercent: number;
  /** Canvas dimensions */
  width: number;
  height: number;
}
