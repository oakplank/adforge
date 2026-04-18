import { describe, it, expect } from 'vitest';
import { getPresetForIntent, applyPresetToLayout, CTA_PROMINENCE } from './intentPresets.js';
import type { IntentPresetConfig } from './intentPresets.js';
import type { LayoutOutput } from './layoutEngine.js';

function makeLayout(): LayoutOutput {
  return {
    format: 'feed',
    width: 1080,
    height: 1080,
    headline: { text: 'Test', position: { x: 100, y: 200 }, fontSize: 48, color: '#FFF', width: 800, height: 60 },
    subhead: { text: 'Sub', position: { x: 100, y: 280 }, fontSize: 28, color: '#FFF', width: 800, height: 40 },
    cta: { text: 'Buy', position: { x: 100, y: 400 }, fontSize: 22, color: '#FFF', width: 200, height: 50 },
    logoPosition: { x: 50, y: 50 },
    textColors: { headline: '#FFF', subhead: '#FFF', cta: '#FFF' },
    contrastRatios: { headline: 7, subhead: 7, cta: 7 },
    readingPattern: 'top-down',
  };
}

describe('getPresetForIntent', () => {
  it('returns conversion preset', () => {
    const preset = getPresetForIntent('conversion');
    expect(preset.intent).toBe('conversion');
    expect(preset.ctaEmphasis).toBe('high');
  });

  it('returns awareness preset', () => {
    const preset = getPresetForIntent('awareness');
    expect(preset.intent).toBe('awareness');
    expect(preset.ctaEmphasis).toBe('low');
  });

  it('returns retargeting preset', () => {
    const preset = getPresetForIntent('retargeting');
    expect(preset.intent).toBe('retargeting');
    expect(preset.ctaEmphasis).toBe('medium');
  });

  it('throws for unknown intent', () => {
    expect(() => getPresetForIntent('unknown' as any)).toThrow('Unknown ad intent');
  });

  it('each preset has at least 5 configurable properties', () => {
    const intents = ['conversion', 'awareness', 'retargeting'] as const;
    for (const intent of intents) {
      const preset = getPresetForIntent(intent);
      const configProps = [
        'headlineWeight', 'headlineSizeRatio', 'subheadWeight', 'subheadSizeRatio',
        'ctaProminenceLevel', 'preferredHeadlineFormulas', 'colorEmphasisStrategy',
      ];
      for (const prop of configProps) {
        expect(preset).toHaveProperty(prop);
      }
    }
  });
});

describe('preset hierarchy relationships', () => {
  it('conversion CTA prominence > awareness CTA prominence', () => {
    const conversion = getPresetForIntent('conversion');
    const awareness = getPresetForIntent('awareness');
    expect(conversion.ctaProminenceLevel).toBeGreaterThan(awareness.ctaProminenceLevel);
  });

  it('conversion CTA prominence > retargeting CTA prominence', () => {
    const conversion = getPresetForIntent('conversion');
    const retargeting = getPresetForIntent('retargeting');
    expect(conversion.ctaProminenceLevel).toBeGreaterThan(retargeting.ctaProminenceLevel);
  });

  it('awareness headline size ratio > conversion headline size ratio', () => {
    const conversion = getPresetForIntent('conversion');
    const awareness = getPresetForIntent('awareness');
    expect(awareness.headlineSizeRatio).toBeGreaterThan(conversion.headlineSizeRatio);
  });

  it('CTA_PROMINENCE maps correctly', () => {
    expect(CTA_PROMINENCE['high']).toBe(3);
    expect(CTA_PROMINENCE['medium']).toBe(2);
    expect(CTA_PROMINENCE['low']).toBe(1);
  });
});

describe('applyPresetToLayout', () => {
  it('adjusts headline font size for conversion', () => {
    const layout = makeLayout();
    const preset = getPresetForIntent('conversion');
    const result = applyPresetToLayout(layout, preset);
    expect(result.headline.fontSize).not.toBe(layout.headline.fontSize);
  });

  it('conversion CTA font size > awareness CTA font size when applied to same layout', () => {
    const layout = makeLayout();
    const convResult = applyPresetToLayout(layout, getPresetForIntent('conversion'));
    const awareResult = applyPresetToLayout(layout, getPresetForIntent('awareness'));
    expect(convResult.cta.fontSize).toBeGreaterThan(awareResult.cta.fontSize);
  });

  it('preserves layout structure', () => {
    const layout = makeLayout();
    const result = applyPresetToLayout(layout, getPresetForIntent('retargeting'));
    expect(result.format).toBe('feed');
    expect(result.width).toBe(1080);
    expect(result.logoPosition).toEqual({ x: 50, y: 50 });
  });

  it('does not mutate original layout', () => {
    const layout = makeLayout();
    const origHeadlineSize = layout.headline.fontSize;
    applyPresetToLayout(layout, getPresetForIntent('conversion'));
    expect(layout.headline.fontSize).toBe(origHeadlineSize);
  });
});
