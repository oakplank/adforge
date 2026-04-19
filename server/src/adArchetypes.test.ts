import { describe, it, expect } from 'vitest';
import {
  AD_ARCHETYPES,
  ARCHETYPE_PICKER_ORDER,
  getArchetype,
  listArchetypes,
} from './adArchetypes.js';
import { buildPromptPipeline } from './promptEngine.js';
import { generateCopy } from './copyEngine.js';
import { generateAdSpec, parsePrompt } from './generateAd.js';

describe('adArchetypes registry', () => {
  it('includes general and all picker-order archetypes', () => {
    expect(AD_ARCHETYPES.general).toBeDefined();
    for (const id of ARCHETYPE_PICKER_ORDER) {
      expect(AD_ARCHETYPES[id]).toBeDefined();
    }
  });

  it('does not expose general in the picker order', () => {
    expect(ARCHETYPE_PICKER_ORDER).not.toContain('general');
  });

  it('listArchetypes returns the picker order with label + description', () => {
    const list = listArchetypes();
    expect(list.map((a) => a.id)).toEqual(ARCHETYPE_PICKER_ORDER);
    for (const entry of list) {
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('getArchetype falls back to general for unknown ids', () => {
    expect(getArchetype('nonexistent').id).toBe('general');
    expect(getArchetype(undefined).id).toBe('general');
  });

  it('every archetype has non-empty creative direction fields', () => {
    for (const a of Object.values(AD_ARCHETYPES)) {
      expect(a.image.systemPrompt.length).toBeGreaterThan(40);
      expect(a.image.styleDirectives.length).toBeGreaterThan(0);
      expect(a.image.lightingHint.length).toBeGreaterThan(0);
      expect(a.image.compositionHint.length).toBeGreaterThan(0);
      expect(a.image.paletteBias.length).toBeGreaterThan(0);
      expect(a.copy.headlineMaxChars).toBeGreaterThan(10);
      expect(a.copy.ctaMaxChars).toBeGreaterThan(5);
    }
  });

  it('every archetype ships at least two concrete example prompts', () => {
    for (const a of Object.values(AD_ARCHETYPES)) {
      expect(a.examplePrompts.length).toBeGreaterThanOrEqual(2);
      for (const prompt of a.examplePrompts) {
        // Examples should be full sentences, not placeholder stubs.
        expect(prompt.length).toBeGreaterThan(30);
      }
    }
  });

  it('listArchetypes includes examplePrompts for each entry', () => {
    const list = listArchetypes();
    for (const entry of list) {
      expect(Array.isArray(entry.examplePrompts)).toBe(true);
      expect(entry.examplePrompts.length).toBeGreaterThan(0);
    }
  });
});

describe('archetype-driven render prompt', () => {
  it('injects luxury editorial direction when luxury is picked', () => {
    const result = buildPromptPipeline({
      rawPrompt: 'bottle of perfume for a premium house',
      product: 'perfume',
      description: 'bottle of perfume',
      vibe: 'luxury',
      format: 'portrait',
      archetypeId: 'luxury',
    });

    const render = result.promptPipeline.renderPrompt;
    expect(render.toLowerCase()).toContain('luxury');
    // The archetype's editorial tone should land in the render prompt,
    // even if not the word "editorial" — so probe for characteristic
    // style phrases we wrote into the luxury brief.
    expect(render.toLowerCase()).toMatch(/gallery|still life|restraint|expensive/);
    expect(render.toLowerCase()).toContain('directional');
    expect(result.archetypeId).toBe('luxury');
  });

  it('injects sale/offer urgency language when sale-offer is picked', () => {
    const result = buildPromptPipeline({
      rawPrompt: 'flash sale 30% off running shoes',
      product: 'running shoes',
      description: 'flash sale 30% off running shoes',
      vibe: 'energetic',
      format: 'square',
      offer: '30% off',
      archetypeId: 'sale-offer',
    });

    const render = result.promptPipeline.renderPrompt;
    expect(render.toLowerCase()).toMatch(/offer|sale|commercial|energetic/);
    expect(result.archetypeId).toBe('sale-offer');
    // Sale archetype routes to the bold-sale template.
    expect(result.suggestedTemplateId).toBe('bold-sale');
  });

  it('uses archetype systemPrompt as the director framing', () => {
    const fit = buildPromptPipeline({
      rawPrompt: 'trail runner in the rain',
      product: 'running shoes',
      description: 'trail runner in the rain',
      vibe: 'energetic',
      format: 'portrait',
      archetypeId: 'fitness-athletic',
    });

    // fitness-athletic system prompt mentions "real athlete" / "effort"
    expect(fit.promptPipeline.systemPrompt.toLowerCase()).toMatch(
      /athlete|effort|motion/,
    );
  });

  it('tech-saas archetype tells the model to avoid laptops/phones', () => {
    const result = buildPromptPipeline({
      rawPrompt: 'a calendar tool that plans your day automatically',
      product: 'AI planning app',
      description: 'a calendar tool',
      vibe: 'professional',
      format: 'square',
      archetypeId: 'tech-saas',
    });
    expect(result.promptPipeline.renderPrompt.toLowerCase()).toContain('laptop');
    // "Avoid: ... laptops" should be present as an avoid clause.
    expect(result.promptPipeline.renderPrompt.toLowerCase()).toContain('avoid');
  });

  it('defaults to general archetype when none provided', () => {
    const result = buildPromptPipeline({
      rawPrompt: 'premium cookware',
      product: 'cookware',
      description: 'premium cookware',
      vibe: 'warm',
      format: 'square',
    });
    expect(result.archetypeId).toBe('general');
  });
});

describe('archetype-driven copy', () => {
  it('sale-offer capitalizes headline in UPPERCASE', () => {
    const copy = generateCopy({
      product: 'running shoes',
      offer: '30% off',
      vibe: 'energetic',
      category: 'fashion',
      archetypeId: 'sale-offer',
      rawPrompt: '30% off running shoes flash sale',
    });

    expect(copy.headline).toBe(copy.headline.toUpperCase());
    // And should stay within sale-offer's 24-char limit.
    expect(copy.headline.length).toBeLessThanOrEqual(24);
  });

  it('editorial-cause wraps headline in pull-quote marks', () => {
    const copy = generateCopy({
      product: 'scholarship fund',
      vibe: 'warm',
      category: 'general',
      archetypeId: 'editorial-cause',
      rawPrompt: 'first-gen college students scholarship fund',
    });

    expect(copy.headline.startsWith('"')).toBe(true);
    expect(copy.headline.endsWith('"')).toBe(true);
  });

  it('luxury returns an empty subhead (subheadRequired=false)', () => {
    const copy = generateCopy({
      product: 'gold ring',
      vibe: 'luxury',
      category: 'jewelry',
      archetypeId: 'luxury',
      rawPrompt: 'solid gold ring hand-forged',
    });
    expect(copy.subhead).toBe('');
  });

  it('general archetype preserves legacy limits (36 / 72 / 18)', () => {
    const copy = generateCopy({
      product: 'cookware',
      vibe: 'warm',
      category: 'general',
      rawPrompt: 'premium cookware for everyday kitchens',
    });
    expect(copy.headline.length).toBeLessThanOrEqual(36);
    expect(copy.subhead.length).toBeLessThanOrEqual(72);
    expect(copy.cta.length).toBeLessThanOrEqual(18);
  });
});

describe('archetype palette wiring', () => {
  it('picks the archetype defaultPalette accent over the vibe map', () => {
    const parsed = parsePrompt('new dive watch');
    const spec = generateAdSpec(parsed, 'square', undefined, 'luxury');
    // Luxury archetype accent is brushed gold.
    expect(spec.colors.accent).toBe('#C9A84C');
    expect(spec.colors.background).toBe('#0F0E0C');
  });

  it('user-named colors in the prompt still override the archetype palette', () => {
    // Explicit "red and black" should beat the luxury cream/ink defaults.
    const parsed = parsePrompt('red and black luxury watch');
    const spec = generateAdSpec(parsed, 'square', undefined, 'luxury');
    expect(spec.colors.primary).toBe('#D32F2F');
    expect(spec.colors.secondary).toBe('#212121');
  });

  it('general archetype still uses the legacy vibe palette', () => {
    const parsed = parsePrompt('premium cookware');
    const spec = generateAdSpec(parsed, 'square');
    // Background should match the legacy non-minimal vibe default.
    expect(spec.colors.background).toBe('#151922');
  });

  it('sale-offer archetype yields its high-contrast red/black palette', () => {
    const parsed = parsePrompt('flash sale');
    const spec = generateAdSpec(parsed, 'square', undefined, 'sale-offer');
    expect(spec.colors.primary).toBe('#DC2626');
    expect(spec.colors.secondary).toBe('#111111');
    expect(spec.colors.accent).toBe('#FACC15');
  });
});

describe('archetype via /api/generate-ad payload', () => {
  it('copy limits shrink when a tighter archetype is picked', () => {
    const generalCopy = generateCopy({
      product: 'watch',
      vibe: 'luxury',
      category: 'jewelry',
      rawPrompt: 'new steel dive watch',
      archetypeId: 'general',
    });
    const luxuryCopy = generateCopy({
      product: 'watch',
      vibe: 'luxury',
      category: 'jewelry',
      rawPrompt: 'new steel dive watch',
      archetypeId: 'luxury',
    });

    // Luxury archetype caps headlines at 24 chars; general allows 36.
    expect(luxuryCopy.headline.length).toBeLessThanOrEqual(24);
    expect(generalCopy.headline.length).toBeLessThanOrEqual(36);
  });
});
