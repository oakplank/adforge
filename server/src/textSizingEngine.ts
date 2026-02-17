/**
 * Text Sizing Engine
 * Dynamic font sizing with clamps, safe zone enforcement, and line length constraints.
 */

import type { TypographyToken, SafeZoneSpec } from './types/textSystem.js';
import { SAFE_ZONE_SPECS, FONT_SIZE_CLAMPS } from './designTokens.js';

/** A positioned element on the canvas */
export interface PositionedElement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Canvas dimensions */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Average character width as a ratio of font size.
 * Approximation: average char width ≈ 0.55 × fontSize for sans-serif.
 */
const AVG_CHAR_WIDTH_RATIO = 0.55;

/**
 * Calculate the optimal font size for text within a container,
 * clamped to the token's min/max range.
 *
 * Uses character count and line wrapping estimation to find the largest
 * size that fits without overflow.
 */
export function calculateDynamicFontSize(
  text: string,
  containerWidth: number,
  containerHeight: number,
  token: TypographyToken,
): number {
  if (!text || text.length === 0) {
    return FONT_SIZE_CLAMPS.clamp(token.default, token);
  }

  // Binary search for the largest font size that fits
  let lo = token.min;
  let hi = token.max;
  let best = token.min;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (textFits(text, containerWidth, containerHeight, mid, token)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return FONT_SIZE_CLAMPS.clamp(best, token);
}

/** Check if text fits in container at a given font size */
function textFits(
  text: string,
  containerWidth: number,
  containerHeight: number,
  fontSize: number,
  token: TypographyToken,
): boolean {
  const charWidth = fontSize * AVG_CHAR_WIDTH_RATIO;
  const charsPerLine = Math.max(1, Math.floor(containerWidth / charWidth));
  const words = text.split(/\s+/);
  let lines = 1;
  let currentLineLength = 0;

  for (const word of words) {
    if (currentLineLength === 0) {
      currentLineLength = word.length;
    } else if (currentLineLength + 1 + word.length > charsPerLine) {
      lines++;
      currentLineLength = word.length;
    } else {
      currentLineLength += 1 + word.length;
    }
  }

  const lineHeight = fontSize * token.lineHeight;
  const totalHeight = lines * lineHeight;
  return totalHeight <= containerHeight;
}

/**
 * Enforce content safe zones by repositioning elements that fall outside
 * the safe bounds for a given format.
 *
 * @param elements - Array of positioned elements to check/adjust
 * @param format - Ad format: 'feed', 'story', or 'reel'
 * @param dimensions - Canvas dimensions
 * @returns New array with repositioned elements
 */
export function enforceContentSafeZone(
  elements: PositionedElement[],
  format: string,
  dimensions: Dimensions,
): PositionedElement[] {
  const spec = SAFE_ZONE_SPECS.find((s) => s.format === format);
  if (!spec) {
    // Fall back to feed defaults (5% all around)
    return enforceContentSafeZone(elements, 'feed', dimensions);
  }

  const safeLeft = (spec.leftPercent / 100) * dimensions.width;
  const safeRight = dimensions.width - (spec.rightPercent / 100) * dimensions.width;
  const safeTop = (spec.topPercent / 100) * dimensions.height;
  const safeBottom = dimensions.height - (spec.bottomPercent / 100) * dimensions.height;

  return elements.map((el) => {
    let { x, y, width, height } = el;

    // Clamp width/height to safe area size if element is larger
    const maxW = safeRight - safeLeft;
    const maxH = safeBottom - safeTop;
    if (width > maxW) width = maxW;
    if (height > maxH) height = maxH;

    // Push into safe bounds
    if (x < safeLeft) x = safeLeft;
    if (y < safeTop) y = safeTop;
    if (x + width > safeRight) x = safeRight - width;
    if (y + height > safeBottom) y = safeBottom - height;

    return { x, y, width, height };
  });
}

/**
 * Constrain line length by inserting newlines at word boundaries.
 * Respects existing newlines. Never breaks mid-word.
 */
export function constrainLineLength(
  text: string,
  maxCharsPerLine: number,
): string {
  if (maxCharsPerLine <= 0) return text;

  return text
    .split('\n')
    .map((paragraph) => wrapParagraph(paragraph, maxCharsPerLine))
    .join('\n');
}

function wrapParagraph(text: string, maxChars: number): string {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return '';

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    if (currentLine.length + 1 + words[i].length <= maxChars) {
      currentLine += ' ' + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  return lines.join('\n');
}
