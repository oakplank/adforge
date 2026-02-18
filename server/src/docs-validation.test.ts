import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const docsDir = resolve(__dirname, '../../docs');

describe('Documentation validation', () => {
  describe('style-guide.md', () => {
    const content = readFileSync(resolve(docsDir, 'style-guide.md'), 'utf-8');

    it('exists and is non-empty', () => {
      expect(content.length).toBeGreaterThan(100);
    });

    const requiredSections = ['Typography', 'Safe Zones', 'CTA', 'Brand Tokens', 'Intent Presets'];

    for (const section of requiredSections) {
      it(`contains section: ${section}`, () => {
        expect(content).toContain(`## ${section}`);
      });
    }

    it('each section has actionable rules', () => {
      // Each section should have numbered rules
      const rulePattern = /\d+\.\s+\*\*/g;
      const matches = content.match(rulePattern);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(15); // At least 3 rules per 5 sections
    });

    it('contains typography scale values', () => {
      expect(content).toContain('24px');
      expect(content).toContain('72px');
      expect(content).toContain('48px');
    });

    it('contains safe zone percentages', () => {
      expect(content).toContain('14%');
      expect(content).toContain('35%');
      expect(content).toContain('15%');
    });

    it('references design tokens module', () => {
      expect(content).toContain('designTokens.ts');
    });

    it('describes all three intent presets', () => {
      expect(content).toContain('### Conversion');
      expect(content).toContain('### Awareness');
      expect(content).toContain('### Retargeting');
    });
  });

  describe('usage-examples.md', () => {
    const content = readFileSync(resolve(docsDir, 'usage-examples.md'), 'utf-8');

    it('exists and is non-empty', () => {
      expect(content.length).toBeGreaterThan(100);
    });

    it('contains at least 4 code examples', () => {
      const codeBlocks = content.match(/```typescript/g);
      expect(codeBlocks).not.toBeNull();
      expect(codeBlocks!.length).toBeGreaterThanOrEqual(4);
    });

    it('shows how to generate an ad with intent', () => {
      expect(content).toContain('generateLayout');
      expect(content).toContain('conversion');
    });

    it('shows how to use design tokens', () => {
      expect(content).toContain('TYPOGRAPHY_SCALE');
      expect(content).toContain('COLOR_TOKENS');
      expect(content).toContain('SPACING_TOKENS');
    });

    it('shows how to create a custom preset', () => {
      expect(content).toContain('AdIntentPreset');
      expect(content).toMatch(/custom|Custom/);
    });

    it('shows how to validate text placement', () => {
      expect(content).toContain('SAFE_ZONE_SPECS');
      expect(content).toContain('calculateDynamicFontSize');
    });
  });
});
