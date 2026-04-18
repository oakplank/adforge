import { describe, it, expect } from 'vitest';
import {
  TYPOGRAPHY_SCALE,
  COLOR_TOKENS,
  SPACING_TOKENS,
  SAFE_ZONE_SPECS,
  AD_INTENT_PRESETS,
  FONT_SIZE_CLAMPS,
} from './designTokens.js';
import type {
  TypographyToken,
  BrandTokenSet,
  AdIntentPreset,
  TextHierarchyConfig,
  SafeZoneSpec,
} from './types/textSystem.js';

describe('TYPOGRAPHY_SCALE', () => {
  const levels: (keyof TextHierarchyConfig)[] = ['headline', 'subhead', 'body', 'cta'];

  it('exports all hierarchy levels', () => {
    for (const level of levels) {
      expect(TYPOGRAPHY_SCALE[level]).toBeDefined();
    }
  });

  for (const level of levels) {
    describe(level, () => {
      it('has min < default < max', () => {
        const t = TYPOGRAPHY_SCALE[level];
        expect(t.min).toBeLessThan(t.default);
        expect(t.default).toBeLessThan(t.max);
      });

      it('has min >= 14 (mobile-first)', () => {
        expect(TYPOGRAPHY_SCALE[level].min).toBeGreaterThanOrEqual(14);
      });

      it('has max <= 96', () => {
        expect(TYPOGRAPHY_SCALE[level].max).toBeLessThanOrEqual(96);
      });

      it('has positive lineHeight', () => {
        expect(TYPOGRAPHY_SCALE[level].lineHeight).toBeGreaterThan(0);
      });

      it('has maxChars > 0', () => {
        expect(TYPOGRAPHY_SCALE[level].maxChars).toBeGreaterThan(0);
      });
    });
  }
});

describe('COLOR_TOKENS', () => {
  it('exports all required color keys', () => {
    expect(COLOR_TOKENS.primary).toBeDefined();
    expect(COLOR_TOKENS.secondary).toBeDefined();
    expect(COLOR_TOKENS.accent).toBeDefined();
    expect(COLOR_TOKENS.text).toBeDefined();
    expect(COLOR_TOKENS.background).toBeDefined();
  });

  it('all colors are valid hex strings', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const [, value] of Object.entries(COLOR_TOKENS)) {
      expect(value).toMatch(hexPattern);
    }
  });

  it('text and background have sufficient contrast (WCAG AA simplified check)', () => {
    // Simple luminance check: white text (#FFFFFF) on dark bg (#0F3460) should pass
    // WCAG AA requires 4.5:1 for normal text
    const getLuminance = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    };
    const textL = getLuminance(COLOR_TOKENS.text);
    const bgL = getLuminance(COLOR_TOKENS.background);
    const ratio = (Math.max(textL, bgL) + 0.05) / (Math.min(textL, bgL) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe('SPACING_TOKENS', () => {
  it('exports spacing values in ascending order', () => {
    const values = [
      SPACING_TOKENS.xs,
      SPACING_TOKENS.sm,
      SPACING_TOKENS.md,
      SPACING_TOKENS.lg,
      SPACING_TOKENS.xl,
      SPACING_TOKENS.xxl,
    ];
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe('SAFE_ZONE_SPECS', () => {
  it('defines specs for feed, story, and reel', () => {
    const formats = SAFE_ZONE_SPECS.map((s) => s.format);
    expect(formats).toContain('feed');
    expect(formats).toContain('story');
    expect(formats).toContain('reel');
  });

  it('all percentages are between 0 and 100', () => {
    for (const spec of SAFE_ZONE_SPECS) {
      for (const key of ['topPercent', 'bottomPercent', 'leftPercent', 'rightPercent'] as const) {
        expect(spec[key]).toBeGreaterThanOrEqual(0);
        expect(spec[key]).toBeLessThanOrEqual(100);
      }
    }
  });

  it('safe zones leave usable content area (top + bottom < 100)', () => {
    for (const spec of SAFE_ZONE_SPECS) {
      expect(spec.topPercent + spec.bottomPercent).toBeLessThan(100);
    }
  });
});

describe('AD_INTENT_PRESETS', () => {
  it('defines conversion, awareness, and retargeting presets', () => {
    expect(AD_INTENT_PRESETS.conversion).toBeDefined();
    expect(AD_INTENT_PRESETS.awareness).toBeDefined();
    expect(AD_INTENT_PRESETS.retargeting).toBeDefined();
  });

  it('each preset has correct intent value', () => {
    expect(AD_INTENT_PRESETS.conversion.intent).toBe('conversion');
    expect(AD_INTENT_PRESETS.awareness.intent).toBe('awareness');
    expect(AD_INTENT_PRESETS.retargeting.intent).toBe('retargeting');
  });

  it('each preset has a description', () => {
    for (const preset of Object.values(AD_INTENT_PRESETS)) {
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });

  it('each preset has ctaEmphasis', () => {
    for (const preset of Object.values(AD_INTENT_PRESETS)) {
      expect(['high', 'medium', 'low']).toContain(preset.ctaEmphasis);
    }
  });
});

describe('FONT_SIZE_CLAMPS', () => {
  it('absoluteMin is 14', () => {
    expect(FONT_SIZE_CLAMPS.absoluteMin).toBe(14);
  });

  it('absoluteMax is 96', () => {
    expect(FONT_SIZE_CLAMPS.absoluteMax).toBe(96);
  });

  it('clamp returns value within token range', () => {
    const token = TYPOGRAPHY_SCALE.headline;
    expect(FONT_SIZE_CLAMPS.clamp(5, token)).toBe(token.min);
    expect(FONT_SIZE_CLAMPS.clamp(200, token)).toBe(token.max);
    expect(FONT_SIZE_CLAMPS.clamp(token.default, token)).toBe(token.default);
  });
});
