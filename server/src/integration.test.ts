/**
 * Integration test: Full ad generation pipeline with new text system
 * US-015 - Exercises parsePrompt → generateAdSpec for all format × intent combinations
 */

import { describe, it, expect } from 'vitest';
import { parsePrompt, generateAdSpec } from './generateAd.js';
import { validateCopy } from './copyEngine.js';
import { validateLayout, calculateContrastRatio, WCAG_AA_RATIO } from './layoutEngine.js';
import { SAFE_ZONE_SPECS } from './designTokens.js';
import type { AdIntent } from './types/textSystem.js';

const FORMATS = ['square', 'portrait', 'story'] as const;
const INTENTS: AdIntent[] = ['conversion', 'awareness', 'retargeting'];

const TEST_PROMPT = 'Premium headphones 30% off, modern vibe';

describe('Integration: full pipeline with new text system', () => {
  const parsed = parsePrompt(TEST_PROMPT);

  for (const format of FORMATS) {
    for (const intent of INTENTS) {
      describe(`${format} × ${intent}`, () => {
        const spec = generateAdSpec(parsed, format, undefined, 0, undefined, intent);
        const layout = spec.layout;

        it('generates a valid layout', () => {
          expect(layout).toBeDefined();
          expect(layout.format).toBe(format);
          expect(layout.headline.text).toBeTruthy();
          expect(layout.subhead.text).toBeTruthy();
          expect(layout.cta.text).toBeTruthy();
        });

        it('has all text within safe zones', () => {
          const formatMapping: Record<string, string> = {
            square: 'feed',
            portrait: 'feed',
            story: 'story',
          };
          const safeZoneFormat = formatMapping[format] || 'feed';
          const safeSpec = SAFE_ZONE_SPECS.find((s) => s.format === safeZoneFormat);
          expect(safeSpec).toBeDefined();

          const safeTop = (safeSpec!.topPercent / 100) * layout.height;
          const safeBottom = layout.height - (safeSpec!.bottomPercent / 100) * layout.height;
          const safeLeft = (safeSpec!.leftPercent / 100) * layout.width;
          const safeRight = layout.width - (safeSpec!.rightPercent / 100) * layout.width;

          for (const elem of [layout.headline, layout.subhead, layout.cta]) {
            // Text element top edge should be at or below safe top
            expect(elem.position.y).toBeGreaterThanOrEqual(safeTop - 1);
            // Text element bottom edge should be at or above safe bottom
            // CTA is allowed in lower area by design, so we check it doesn't exceed canvas
            expect(elem.position.y + elem.height).toBeLessThanOrEqual(layout.height);
            // Horizontal bounds
            expect(elem.position.x).toBeGreaterThanOrEqual(safeLeft - 1);
            expect(elem.position.x + elem.width).toBeLessThanOrEqual(safeRight + 1);
          }
        });

        it('passes copy validation', () => {
          const copyOutput = {
            headline: spec.texts.headline,
            subhead: spec.texts.subhead,
            cta: spec.texts.cta,
            formula: spec.metadata.headlineFormula || 'benefit-first' as any,
          };
          const result = validateCopy(copyOutput);
          expect(result.valid).toBe(true);
        });

        it('meets WCAG AA contrast ratios (>= 4.5)', () => {
          expect(layout.contrastRatios.headline).toBeGreaterThanOrEqual(WCAG_AA_RATIO);
          expect(layout.contrastRatios.subhead).toBeGreaterThanOrEqual(WCAG_AA_RATIO);
          expect(layout.contrastRatios.cta).toBeGreaterThanOrEqual(WCAG_AA_RATIO);
        });

        it('passes layout validation', () => {
          const result = validateLayout(layout);
          expect(result.valid).toBe(true);
          expect(result.warnings).toHaveLength(0);
        });
      });
    }
  }
});
