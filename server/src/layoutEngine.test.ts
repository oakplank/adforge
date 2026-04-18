import { describe, it, expect } from 'vitest';
import {
  calculateContrastRatio,
  meetsContrastRequirement,
  findAccessibleTextColor,
  calculateFontSize,
  generateLayout,
  validateLayout,
  balanceVisualWeight,
  WCAG_AA_RATIO,
  SAFE_ZONES,
  FONT_SIZES,
} from './layoutEngine.js';
import type { AdIntent } from './types/textSystem.js';

describe('calculateContrastRatio', () => {
  it('calculates maximum contrast for black on white', () => {
    const ratio = calculateContrastRatio('#FFFFFF', '#000000');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('calculates ratio for white on black', () => {
    const ratio = calculateContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('calculates same contrast regardless of color order', () => {
    const ratio1 = calculateContrastRatio('#FF0000', '#0000FF');
    const ratio2 = calculateContrastRatio('#0000FF', '#FF0000');
    expect(ratio1).toBeCloseTo(ratio2, 2);
  });

  it('returns 1 for same colors', () => {
    const ratio = calculateContrastRatio('#808080', '#808080');
    expect(ratio).toBeCloseTo(1, 1);
  });
});

describe('meetsContrastRequirement', () => {
  it('returns true for high contrast combinations', () => {
    expect(meetsContrastRequirement('#FFFFFF', '#000000')).toBe(true);
    expect(meetsContrastRequirement('#000000', '#FFFFFF')).toBe(true);
  });

  it('returns false for low contrast combinations', () => {
    expect(meetsContrastRequirement('#777777', '#888888')).toBe(false);
    expect(meetsContrastRequirement('#FFFF00', '#FFFFFF')).toBe(false);
  });

  it('returns true for WCAG AA compliant combinations', () => {
    // Navy on white should pass
    expect(meetsContrastRequirement('#FFFFFF', '#1B365D')).toBe(true);
  });
});

describe('findAccessibleTextColor', () => {
  it('returns white for dark backgrounds', () => {
    const result = findAccessibleTextColor('#121212');
    expect(result.color).toBe('#FFFFFF');
    expect(result.ratio).toBeGreaterThanOrEqual(WCAG_AA_RATIO);
  });

  it('returns black for light backgrounds', () => {
    const result = findAccessibleTextColor('#F5F5F5');
    expect(result.color).toBe('#000000');
    expect(result.ratio).toBeGreaterThanOrEqual(WCAG_AA_RATIO);
  });

  it('uses preferred color when it meets requirements', () => {
    const result = findAccessibleTextColor('#000000', '#FFFFFF');
    expect(result.color).toBe('#FFFFFF');
  });

  it('falls back to best option for edge cases', () => {
    const result = findAccessibleTextColor('#808080');
    // Should return either white or black
    expect(['#FFFFFF', '#000000']).toContain(result.color);
  });
});

describe('calculateFontSize', () => {
  it('returns default size for short text', () => {
    const size = calculateFontSize('Hi', FONT_SIZES.headline, 1000);
    expect(size).toBe(FONT_SIZES.headline.default);
  });

  it('scales down for long text', () => {
    const longText = 'This is a very long headline text that needs to fit';
    const size = calculateFontSize(longText, FONT_SIZES.headline, 500);
    expect(size).toBeLessThan(FONT_SIZES.headline.default);
  });

  it('never goes below minimum', () => {
    const veryLongText = 'This is an extremely long text that would normally require a tiny font size';
    const size = calculateFontSize(veryLongText, FONT_SIZES.headline, 200);
    expect(size).toBeGreaterThanOrEqual(FONT_SIZES.headline.min);
  });

  it('never exceeds maximum', () => {
    const shortText = 'Hi';
    const size = calculateFontSize(shortText, FONT_SIZES.headline, 2000);
    expect(size).toBeLessThanOrEqual(FONT_SIZES.headline.max);
  });
});

describe('generateLayout', () => {
  it('returns complete layout for square format', () => {
    const layout = generateLayout('square', 'Headline', 'Subhead text', 'Shop', '#121212', '#FF6B00');

    expect(layout.format).toBe('square');
    expect(layout.width).toBe(1080);
    expect(layout.height).toBe(1080);
    expect(layout.headline).toBeDefined();
    expect(layout.subhead).toBeDefined();
    expect(layout.cta).toBeDefined();
    expect(layout.logoPosition).toBeDefined();
    expect(layout.textColors).toBeDefined();
    expect(layout.contrastRatios).toBeDefined();
  });

  it('returns correct dimensions for portrait format', () => {
    const layout = generateLayout('portrait', 'Headline', 'Subhead', 'CTA', '#121212', '#FF6B00');

    expect(layout.format).toBe('portrait');
    expect(layout.width).toBe(1080);
    expect(layout.height).toBe(1350);
  });

  it('returns correct dimensions for story format', () => {
    const layout = generateLayout('story', 'Headline', 'Subhead', 'CTA', '#121212', '#FF6B00');

    expect(layout.format).toBe('story');
    expect(layout.width).toBe(1080);
    expect(layout.height).toBe(1920);
  });

  it('calculates appropriate font sizes', () => {
    const layout = generateLayout('square', 'Short', 'Medium subhead', 'CTA', '#121212', '#FF6B00');

    // Font sizes should be within the new TYPOGRAPHY_SCALE ranges
    expect(layout.headline.fontSize).toBeGreaterThanOrEqual(24);
    expect(layout.headline.fontSize).toBeLessThanOrEqual(72);
    expect(layout.subhead.fontSize).toBeGreaterThanOrEqual(18);
    expect(layout.subhead.fontSize).toBeLessThanOrEqual(48);
  });

  it('provides accessible text colors', () => {
    const layout = generateLayout('square', 'Headline', 'Subhead', 'CTA', '#121212', '#FF6B00');

    expect(layout.contrastRatios.headline).toBeGreaterThan(1);
    expect(layout.contrastRatios.subhead).toBeGreaterThan(1);
    expect(layout.contrastRatios.cta).toBeGreaterThan(1);
  });

  it('selects reading pattern based on format', () => {
    const squareLayout = generateLayout('square', 'H', 'S', 'C', '#121212', '#FF6B00');
    const storyLayout = generateLayout('story', 'H', 'S', 'C', '#121212', '#FF6B00');

    expect(squareLayout.readingPattern).toBe('f-pattern');
    expect(storyLayout.readingPattern).toBe('z-pattern');
  });

  it('places logo in top-right corner', () => {
    const layout = generateLayout('square', 'H', 'S', 'C', '#121212', '#FF6B00');

    expect(layout.logoPosition.x).toBeGreaterThan(layout.width / 2);
    expect(layout.logoPosition.y).toBeLessThan(layout.height / 4);
  });
});

describe('validateLayout', () => {
  it('returns valid for good contrast', () => {
    // Use dark background (#121212) which should give good contrast with white text
    // And use a dark accent color (#1565C0 blue) for CTA button
    const layout = generateLayout('square', 'Test', 'Subhead', 'CTA', '#121212', '#1565C0');
    const result = validateLayout(layout);

    // Check that contrast ratios are above WCAG AA minimum
    expect(layout.contrastRatios.headline).toBeGreaterThanOrEqual(4.5);
    expect(layout.contrastRatios.subhead).toBeGreaterThanOrEqual(4.5);
    expect(layout.contrastRatios.cta).toBeGreaterThanOrEqual(4.5);
    
    // If there are warnings, they should only be about safe zones, not contrast
    // (contrast was already validated above)
    const contrastWarnings = result.warnings.filter(w => w.includes('contrast'));
    expect(contrastWarnings).toHaveLength(0);
  });

  it('warns about low contrast', () => {
    const layout = generateLayout('square', 'Test', 'Sub', 'CTA', '#808080', '#888888');
    
    // Manually override to create low contrast scenario
    layout.contrastRatios.headline = 1.5;
    
    const result = validateLayout(layout);
    expect(result.valid).toBe(false);
    expect(result.warnings.some(w => w.includes('contrast'))).toBe(true);
  });
});

describe('balanceVisualWeight', () => {
  it('shifts text right when image is on left', () => {
    const layout = generateLayout('square', 'Test', 'Sub', 'CTA', '#121212', '#FF6B00');
    const originalX = layout.headline.position.x;
    
    const balanced = balanceVisualWeight(layout, 'left');
    
    expect(balanced.headline.position.x).toBeGreaterThan(originalX);
  });

  it('shifts text left when image is on right', () => {
    const layout = generateLayout('square', 'Test', 'Sub', 'CTA', '#121212', '#FF6B00');
    const originalX = layout.headline.position.x;
    
    const balanced = balanceVisualWeight(layout, 'right');
    
    expect(balanced.headline.position.x).toBeLessThan(originalX);
  });

  it('does not shift for centered images', () => {
    const layout = generateLayout('square', 'Test', 'Sub', 'CTA', '#121212', '#FF6B00');
    const balanced = balanceVisualWeight(layout, 'center');
    
    expect(balanced.headline.position.x).toBe(layout.headline.position.x);
  });
});

describe('SAFE_ZONES', () => {
  it('defines safe zones for all formats', () => {
    expect(SAFE_ZONES.square).toBeDefined();
    expect(SAFE_ZONES.portrait).toBeDefined();
    expect(SAFE_ZONES.story).toBeDefined();
  });

  it('has larger bottom safe zone for story format', () => {
    expect(SAFE_ZONES.story.bottom).toBeGreaterThan(SAFE_ZONES.square.bottom);
  });
});

describe('WCAG_AA_RATIO', () => {
  it('is set to 4.5', () => {
    expect(WCAG_AA_RATIO).toBe(4.5);
  });
});

describe('generateLayout with intent parameter', () => {
  const intents: AdIntent[] = ['conversion', 'awareness', 'retargeting'];

  it('accepts optional intent parameter without breaking', () => {
    const layoutWithout = generateLayout('square', 'Test', 'Sub', 'CTA', '#121212', '#FF6B00');
    const layoutWith = generateLayout('square', 'Test', 'Sub', 'CTA', '#121212', '#FF6B00', 'conversion');
    
    expect(layoutWithout.format).toBe('square');
    expect(layoutWith.format).toBe('square');
    expect(layoutWith.width).toBe(1080);
    expect(layoutWith.height).toBe(1080);
  });

  it('generates valid layout for each intent', () => {
    for (const intent of intents) {
      const layout = generateLayout('square', 'Headline', 'Subhead', 'Shop Now', '#121212', '#FF6B00', intent);
      expect(layout.headline).toBeDefined();
      expect(layout.subhead).toBeDefined();
      expect(layout.cta).toBeDefined();
      expect(layout.headline.fontSize).toBeGreaterThan(0);
      expect(layout.subhead.fontSize).toBeGreaterThan(0);
      expect(layout.cta.fontSize).toBeGreaterThan(0);
    }
  });

  it('conversion intent has larger CTA than awareness', () => {
    const conversion = generateLayout('square', 'Buy Now', 'Great deal', 'Shop', '#121212', '#FF6B00', 'conversion');
    const awareness = generateLayout('square', 'Buy Now', 'Great deal', 'Shop', '#121212', '#FF6B00', 'awareness');
    
    expect(conversion.cta.fontSize).toBeGreaterThan(awareness.cta.fontSize);
  });

  it('awareness intent has larger headline than conversion', () => {
    const conversion = generateLayout('square', 'Headline', 'Sub', 'CTA', '#121212', '#FF6B00', 'conversion');
    const awareness = generateLayout('square', 'Headline', 'Sub', 'CTA', '#121212', '#FF6B00', 'awareness');
    
    expect(awareness.headline.fontSize).toBeGreaterThan(conversion.headline.fontSize);
  });

  it('works with all format types and intents', () => {
    const formats = ['square', 'portrait', 'story'];
    for (const format of formats) {
      for (const intent of intents) {
        const layout = generateLayout(format, 'H', 'S', 'C', '#121212', '#FF6B00', intent);
        expect(layout.format).toBe(format);
        expect(layout.headline.fontSize).toBeGreaterThan(0);
      }
    }
  });

  it('maintains backward compatibility - no intent gives same structure', () => {
    const layout = generateLayout('square', 'Test', 'Sub', 'CTA', '#121212', '#FF6B00');
    
    // All original fields must exist
    expect(layout).toHaveProperty('format');
    expect(layout).toHaveProperty('width');
    expect(layout).toHaveProperty('height');
    expect(layout).toHaveProperty('headline');
    expect(layout).toHaveProperty('subhead');
    expect(layout).toHaveProperty('cta');
    expect(layout).toHaveProperty('logoPosition');
    expect(layout).toHaveProperty('textColors');
    expect(layout).toHaveProperty('contrastRatios');
    expect(layout).toHaveProperty('readingPattern');
  });
});

describe('deprecated constants still exported', () => {
  it('FONT_SIZES still available for backward compatibility', () => {
    expect(FONT_SIZES.headline).toBeDefined();
    expect(FONT_SIZES.subhead).toBeDefined();
    expect(FONT_SIZES.cta).toBeDefined();
  });

  it('SAFE_ZONES still available for backward compatibility', () => {
    expect(SAFE_ZONES.square).toBeDefined();
    expect(SAFE_ZONES.portrait).toBeDefined();
    expect(SAFE_ZONES.story).toBeDefined();
  });
});
