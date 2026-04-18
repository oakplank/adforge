import { describe, it, expect } from 'vitest';
import {
  calculateDynamicFontSize,
  enforceContentSafeZone,
  constrainLineLength,
} from './textSizingEngine.js';
import { TYPOGRAPHY_SCALE } from './designTokens.js';
import type { TypographyToken } from './types/textSystem.js';

const headlineToken = TYPOGRAPHY_SCALE.headline;
const bodyToken = TYPOGRAPHY_SCALE.body;
const ctaToken = TYPOGRAPHY_SCALE.cta;

// ── calculateDynamicFontSize ──────────────────────────────────────

describe('calculateDynamicFontSize', () => {
  it('returns default for empty text', () => {
    const size = calculateDynamicFontSize('', 1080, 1080, headlineToken);
    expect(size).toBe(headlineToken.default);
  });

  it('never returns below token min', () => {
    // Very long text in a tiny container should still respect min
    const longText = 'word '.repeat(500);
    const size = calculateDynamicFontSize(longText, 100, 50, bodyToken);
    expect(size).toBeGreaterThanOrEqual(bodyToken.min);
  });

  it('never returns above token max', () => {
    const size = calculateDynamicFontSize('Hi', 5000, 5000, headlineToken);
    expect(size).toBeLessThanOrEqual(headlineToken.max);
  });

  it('returns larger size for short text', () => {
    const shortSize = calculateDynamicFontSize('Sale', 1080, 1080, headlineToken);
    const longSize = calculateDynamicFontSize(
      'This is a much longer headline that takes up more space on the canvas',
      1080,
      1080,
      headlineToken,
    );
    expect(shortSize).toBeGreaterThanOrEqual(longSize);
  });

  it('returns smaller size for narrow container', () => {
    const text = 'Limited Time Offer';
    const wideSize = calculateDynamicFontSize(text, 1080, 500, headlineToken);
    const narrowSize = calculateDynamicFontSize(text, 300, 500, headlineToken);
    expect(wideSize).toBeGreaterThanOrEqual(narrowSize);
  });

  it('handles single character', () => {
    const size = calculateDynamicFontSize('A', 1080, 1080, headlineToken);
    expect(size).toBe(headlineToken.max);
  });

  it('handles CTA token range', () => {
    const size = calculateDynamicFontSize('Shop Now', 400, 100, ctaToken);
    expect(size).toBeGreaterThanOrEqual(ctaToken.min);
    expect(size).toBeLessThanOrEqual(ctaToken.max);
  });
});

// ── enforceContentSafeZone ────────────────────────────────────────

describe('enforceContentSafeZone', () => {
  const dims = { width: 1080, height: 1080 };
  const storyDims = { width: 1080, height: 1920 };

  it('does not move element already inside safe zone (feed/square)', () => {
    const elements = [{ x: 200, y: 200, width: 300, height: 100 }];
    const result = enforceContentSafeZone(elements, 'feed', dims);
    expect(result[0]).toEqual({ x: 200, y: 200, width: 300, height: 100 });
  });

  it('pushes element right when too far left (feed)', () => {
    const elements = [{ x: 10, y: 200, width: 100, height: 50 }];
    const result = enforceContentSafeZone(elements, 'feed', dims);
    // feed left safe = 5% of 1080 = 54
    expect(result[0].x).toBe(54);
  });

  it('pushes element down when too high (story)', () => {
    const elements = [{ x: 200, y: 10, width: 100, height: 50 }];
    const result = enforceContentSafeZone(elements, 'story', storyDims);
    // story top safe = 14% of 1920 = 268.8
    expect(result[0].y).toBeCloseTo(268.8, 0);
  });

  it('pushes element up when in bottom danger zone (story)', () => {
    const elements = [{ x: 200, y: 1800, width: 100, height: 50 }];
    const result = enforceContentSafeZone(elements, 'story', storyDims);
    // story bottom safe = 1920 - 35% of 1920 = 1920 - 672 = 1248
    expect(result[0].y + result[0].height).toBeLessThanOrEqual(1248);
  });

  it('handles reel format right margin', () => {
    const elements = [{ x: 1000, y: 500, width: 100, height: 50 }];
    const result = enforceContentSafeZone(elements, 'reel', storyDims);
    // reel right safe = 1080 - 15% of 1080 = 1080 - 162 = 918
    expect(result[0].x + result[0].width).toBeLessThanOrEqual(918);
  });

  it('falls back to feed for unknown format', () => {
    const elements = [{ x: 10, y: 10, width: 100, height: 50 }];
    const result = enforceContentSafeZone(elements, 'unknown', dims);
    expect(result[0].x).toBe(54); // feed left = 5% of 1080
  });

  it('constrains oversized element to safe area', () => {
    const elements = [{ x: 0, y: 0, width: 2000, height: 2000 }];
    const result = enforceContentSafeZone(elements, 'feed', dims);
    // Safe area: 54 to 1026 (width 972), 54 to 972 (height 918)
    expect(result[0].width).toBeLessThanOrEqual(972);
    expect(result[0].height).toBeLessThanOrEqual(918);
  });
});

// ── constrainLineLength ───────────────────────────────────────────

describe('constrainLineLength', () => {
  it('does not break short text', () => {
    expect(constrainLineLength('Hello world', 50)).toBe('Hello world');
  });

  it('breaks at word boundary', () => {
    const result = constrainLineLength('one two three four five', 10);
    const lines = result.split('\n');
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(10);
    }
  });

  it('preserves existing newlines', () => {
    const result = constrainLineLength('line one\nline two', 50);
    expect(result).toBe('line one\nline two');
  });

  it('handles single long word gracefully', () => {
    const result = constrainLineLength('Supercalifragilisticexpialidocious', 10);
    // Single word can't be broken, stays as-is
    expect(result).toBe('Supercalifragilisticexpialidocious');
  });

  it('handles empty string', () => {
    expect(constrainLineLength('', 20)).toBe('');
  });

  it('wraps body text at 60 chars', () => {
    const text =
      'This is a longer piece of body text that should be wrapped at approximately sixty characters per line for optimal readability on mobile devices';
    const result = constrainLineLength(text, 60);
    const lines = result.split('\n');
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(60);
    }
    expect(lines.length).toBeGreaterThan(1);
  });
});
