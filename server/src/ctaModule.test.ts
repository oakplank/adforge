import { describe, it, expect } from 'vitest';
import { generateCtaConfig, contrastRatio, type AdFormat } from './ctaModule.js';
import type { BrandTokenSet, AdIntent } from './types/textSystem.js';
import { CHAR_LIMITS } from './copyEngine.js';

const defaultTokens: BrandTokenSet = {
  primary: '#1A1A2E',
  secondary: '#16213E',
  accent: '#E94560',
  text: '#FFFFFF',
  background: '#0F3460',
};

const intents: AdIntent[] = ['conversion', 'awareness', 'retargeting'];
const formats: AdFormat[] = ['feed', 'story', 'reel'];

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });

  it('returns 1 for same color', () => {
    expect(contrastRatio('#FF0000', '#FF0000')).toBeCloseTo(1, 1);
  });
});

describe('generateCtaConfig', () => {
  // 3 intents × 3 formats = 9 combinations
  for (const intent of intents) {
    for (const format of formats) {
      describe(`${intent} × ${format}`, () => {
        const config = generateCtaConfig('Shop Now', defaultTokens, intent, format);

        it('has contrast ratio >= 4.5 (WCAG AA)', () => {
          expect(config.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });

        it('meets minimum 44px touch target height', () => {
          expect(config.minHeight).toBeGreaterThanOrEqual(44);
        });

        it('meets minimum 44px touch target width', () => {
          expect(config.minWidth).toBeGreaterThanOrEqual(44);
        });

        it('returns valid text', () => {
          expect(config.text).toBe('Shop Now');
          expect(config.text.length).toBeLessThanOrEqual(CHAR_LIMITS.cta);
        });

        it('has positive fontSize', () => {
          expect(config.fontSize).toBeGreaterThan(0);
        });

        it('has valid position', () => {
          expect(config.position.x).toBeTruthy();
          expect(config.position.y).toBeTruthy();
        });
      });
    }
  }

  it('truncates text exceeding CHAR_LIMITS.cta', () => {
    const longText = 'A'.repeat(20);
    const config = generateCtaConfig(longText, defaultTokens, 'conversion', 'feed');
    expect(config.text.length).toBeLessThanOrEqual(CHAR_LIMITS.cta);
  });

  it('story format has larger font than feed for same intent', () => {
    const feed = generateCtaConfig('Buy', defaultTokens, 'conversion', 'feed');
    const story = generateCtaConfig('Buy', defaultTokens, 'conversion', 'story');
    expect(story.fontSize).toBeGreaterThanOrEqual(feed.fontSize);
  });

  it('conversion intent has higher emphasis borderRadius than awareness', () => {
    const conv = generateCtaConfig('Buy', defaultTokens, 'conversion', 'feed');
    const aware = generateCtaConfig('Buy', defaultTokens, 'awareness', 'feed');
    expect(conv.borderRadius).toBeGreaterThan(aware.borderRadius);
  });

  it('handles low-contrast brand tokens by falling back', () => {
    const lowContrastTokens: BrandTokenSet = {
      primary: '#808080',
      secondary: '#808080',
      accent: '#808080',
      text: '#7F7F7F',
      background: '#808080',
    };
    const config = generateCtaConfig('Go', lowContrastTokens, 'conversion', 'feed');
    expect(config.contrastRatio).toBeGreaterThanOrEqual(4.5);
  });
});
