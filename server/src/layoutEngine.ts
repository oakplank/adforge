// Layout Engine - Text positioning, contrast checking, and visual layout

import type { AdIntent } from './types/textSystem.js';
import { TYPOGRAPHY_SCALE, SAFE_ZONE_SPECS, AD_INTENT_PRESETS, COLOR_TOKENS } from './designTokens.js';
import { calculateDynamicFontSize } from './textSizingEngine.js';
import { generateCtaConfig } from './ctaModule.js';
import { getPresetForIntent, applyPresetToLayout } from './intentPresets.js';

export const WCAG_AA_RATIO = 4.5;

/** @deprecated Use SAFE_ZONE_SPECS from designTokens instead */
export const SAFE_ZONES = {
  square: { top: 0.20, bottom: 0.25 },
  portrait: { top: 0.20, bottom: 0.25 },
  story: { top: 0.20, bottom: 0.30 },
};

/** @deprecated Use TYPOGRAPHY_SCALE from designTokens instead */
export const FONT_SIZES = {
  headline: { min: 24, max: 72, default: 48 },
  subhead: { min: 16, max: 36, default: 24 },
  cta: { min: 14, max: 28, default: 20 },
};

const FORMAT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

interface FontSizeConfig {
  min: number;
  max: number;
  default: number;
}

interface Position {
  x: number;
  y: number;
}

interface TextElement {
  text: string;
  position: Position;
  fontSize: number;
  color: string;
  width: number;
  height: number;
}

export interface LayoutOutput {
  format: string;
  width: number;
  height: number;
  headline: TextElement;
  subhead: TextElement;
  cta: TextElement;
  logoPosition: Position;
  textColors: { headline: string; subhead: string; cta: string };
  contrastRatios: { headline: number; subhead: number; cta: number };
  readingPattern: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function calculateContrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastRequirement(color1: string, color2: string): boolean {
  return calculateContrastRatio(color1, color2) >= WCAG_AA_RATIO;
}

export function findAccessibleTextColor(
  bgColor: string,
  preferred?: string
): { color: string; ratio: number } {
  if (preferred) {
    const ratio = calculateContrastRatio(preferred, bgColor);
    if (ratio >= WCAG_AA_RATIO) return { color: preferred, ratio };
  }
  const whiteRatio = calculateContrastRatio('#FFFFFF', bgColor);
  const blackRatio = calculateContrastRatio('#000000', bgColor);
  return whiteRatio >= blackRatio
    ? { color: '#FFFFFF', ratio: whiteRatio }
    : { color: '#000000', ratio: blackRatio };
}

export function calculateFontSize(
  text: string,
  config: FontSizeConfig,
  containerWidth: number
): number {
  const charWidth = 0.6; // approximate ratio
  const idealSize = containerWidth / (text.length * charWidth);
  return Math.min(config.max, Math.max(config.min, Math.min(config.default, idealSize)));
}

export function generateLayout(
  format: string,
  headline: string,
  subhead: string,
  ctaText: string,
  bgColor: string,
  accentColor: string,
  intent?: AdIntent
): LayoutOutput {
  const dims = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.square;
  const { width, height } = dims;

  // Use new safe zone specs when available, fall back to legacy SAFE_ZONES
  const formatMapping: Record<string, string> = { square: 'feed', portrait: 'feed', story: 'story' };
  const safeZoneFormat = formatMapping[format] || 'feed';
  const safeSpec = SAFE_ZONE_SPECS.find((s) => s.format === safeZoneFormat);

  const safeTop = safeSpec ? (safeSpec.topPercent / 100) * height : height * 0.20;
  const safeBottom = safeSpec ? height - (safeSpec.bottomPercent / 100) * height : height * 0.75;
  const contentWidth = width * 0.8;
  const contentX = width * 0.1;

  // Text colors
  const headlineColor = findAccessibleTextColor(bgColor);
  const subheadColor = findAccessibleTextColor(bgColor);
  const ctaColor = findAccessibleTextColor(accentColor);

  // Font sizes - use new dynamic sizing engine
  const contentHeight = safeBottom - safeTop;
  const headlineFontSize = calculateDynamicFontSize(
    headline, contentWidth, contentHeight * 0.4, TYPOGRAPHY_SCALE.headline
  );
  const subheadFontSize = calculateDynamicFontSize(
    subhead, contentWidth, contentHeight * 0.3, TYPOGRAPHY_SCALE.subhead
  );
  const ctaFontSize = calculateDynamicFontSize(
    ctaText, contentWidth * 0.4, contentHeight * 0.2, TYPOGRAPHY_SCALE.cta
  );

  // Positions - headline in safe zone, subhead below, CTA in lower third
  const headlineY = safeTop + 20;
  const subheadY = headlineY + headlineFontSize + 20;
  const ctaY = height * 0.75; // lower third

  const readingPattern = format === 'story' ? 'z-pattern' : 'f-pattern';

  let layout: LayoutOutput = {
    format,
    width,
    height,
    headline: {
      text: headline,
      position: { x: contentX, y: headlineY },
      fontSize: headlineFontSize,
      color: headlineColor.color,
      width: contentWidth,
      height: headlineFontSize * 1.2,
    },
    subhead: {
      text: subhead,
      position: { x: contentX, y: subheadY },
      fontSize: subheadFontSize,
      color: subheadColor.color,
      width: contentWidth,
      height: subheadFontSize * 1.2,
    },
    cta: {
      text: ctaText,
      position: { x: contentX, y: ctaY },
      fontSize: ctaFontSize,
      color: ctaColor.color,
      width: contentWidth * 0.4,
      height: ctaFontSize * 2,
    },
    logoPosition: { x: width * 0.85, y: height * 0.05 },
    textColors: {
      headline: headlineColor.color,
      subhead: subheadColor.color,
      cta: ctaColor.color,
    },
    contrastRatios: {
      headline: headlineColor.ratio,
      subhead: subheadColor.ratio,
      cta: ctaColor.ratio,
    },
    readingPattern,
  };

  // Apply intent preset if provided
  if (intent) {
    const presetConfig = getPresetForIntent(intent);
    layout = applyPresetToLayout(layout, presetConfig);
  }

  return layout;
}

export function validateLayout(layout: LayoutOutput): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (layout.contrastRatios.headline < WCAG_AA_RATIO)
    warnings.push('Headline contrast ratio below WCAG AA');
  if (layout.contrastRatios.subhead < WCAG_AA_RATIO)
    warnings.push('Subhead contrast ratio below WCAG AA');
  if (layout.contrastRatios.cta < WCAG_AA_RATIO)
    warnings.push('CTA contrast ratio below WCAG AA');

  return { valid: warnings.length === 0, warnings };
}

export function balanceVisualWeight(
  layout: LayoutOutput,
  imagePosition: 'left' | 'right' | 'center'
): LayoutOutput {
  const result = JSON.parse(JSON.stringify(layout)) as LayoutOutput;
  const shift = layout.width * 0.1;

  if (imagePosition === 'left') {
    result.headline.position.x += shift;
    result.subhead.position.x += shift;
    result.cta.position.x += shift;
  } else if (imagePosition === 'right') {
    result.headline.position.x -= shift;
    result.subhead.position.x -= shift;
    result.cta.position.x -= shift;
  }

  return result;
}
