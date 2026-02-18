import { describe, it, expect } from 'vitest';
import type { Layer, LayerType, TokenRole, BrandTextPreset } from './layers';
import { BRAND_TEXT_PRESETS, DEFAULT_TEXT_STYLE, DEFAULT_CTA_STYLE } from './layers';

describe('Layer types', () => {
  it('Layer type can be constructed', () => {
    const layer: Layer = {
      id: 'layer-1',
      type: 'image',
      name: 'Background',
      zIndex: 0,
      visible: true,
      locked: false,
      opacity: 1,
      fabricObject: null,
    };
    expect(layer.id).toBe('layer-1');
    expect(layer.type).toBe('image');
  });

  it('LayerType includes all expected types', () => {
    const types: LayerType[] = ['image', 'text', 'shape', 'background'];
    expect(types).toHaveLength(4);
  });
});

describe('TextStyle tokenRole', () => {
  it('TextStyle accepts optional tokenRole', () => {
    const style = { ...DEFAULT_TEXT_STYLE, tokenRole: 'headline' as TokenRole };
    expect(style.tokenRole).toBe('headline');
  });

  it('TextStyle works without tokenRole', () => {
    expect(DEFAULT_TEXT_STYLE.tokenRole).toBeUndefined();
  });
});

describe('BRAND_TEXT_PRESETS', () => {
  const roles: TokenRole[] = ['headline', 'subhead', 'body', 'cta'];

  it('has entries for all four token roles', () => {
    expect(Object.keys(BRAND_TEXT_PRESETS)).toEqual(roles);
  });

  it.each(roles)('%s preset has required fields', (role) => {
    const preset: BrandTextPreset = BRAND_TEXT_PRESETS[role];
    expect(preset.fontFamily).toEqual(expect.any(String));
    expect(preset.fontSizeMin).toBeLessThan(preset.fontSizeMax);
    expect(preset.fontWeight).toMatch(/^(normal|bold)$/);
    expect(preset.letterSpacing).toEqual(expect.any(Number));
    expect(preset.lineHeight).toBeGreaterThan(0);
  });

  it('headline has largest max font size', () => {
    expect(BRAND_TEXT_PRESETS.headline.fontSizeMax).toBeGreaterThan(BRAND_TEXT_PRESETS.subhead.fontSizeMax);
    expect(BRAND_TEXT_PRESETS.subhead.fontSizeMax).toBeGreaterThan(BRAND_TEXT_PRESETS.body.fontSizeMax);
  });

  it('DEFAULT_TEXT_STYLE uses headline preset fontSize', () => {
    expect(DEFAULT_TEXT_STYLE.fontSize).toBe(BRAND_TEXT_PRESETS.headline.fontSizeMax);
    expect(DEFAULT_TEXT_STYLE.fontFamily).toBe(BRAND_TEXT_PRESETS.headline.fontFamily);
  });

  it('DEFAULT_CTA_STYLE derives padding from cta preset', () => {
    expect(DEFAULT_CTA_STYLE.paddingX).toBe(BRAND_TEXT_PRESETS.cta.fontSizeMax);
    expect(DEFAULT_CTA_STYLE.paddingY).toBe(Math.round(BRAND_TEXT_PRESETS.cta.fontSizeMax * 0.4));
  });
});
