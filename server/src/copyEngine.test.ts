import { describe, it, expect } from 'vitest';
import {
  generateCopy,
  validateCopy,
  CHAR_LIMITS,
  RETARGETING_CTA_CANDIDATES,
} from './copyEngine.js';

describe('generateCopy', () => {
  it('is deterministic for identical input', () => {
    const input = {
      product: 'sneakers',
      offer: '20% off',
      vibe: 'energetic',
      category: 'fashion',
      objective: 'offer' as const,
    };

    const a = generateCopy(input);
    const b = generateCopy(input);

    expect(a).toEqual(b);
  });

  it('rotates output when variantOffset changes', () => {
    const base = generateCopy({
      product: 'PartingWord',
      vibe: 'calm',
      category: 'general',
      objective: 'launch',
      rawPrompt: 'PartingWord.com end of life messaging platform',
      variantOffset: 0,
    });

    const variant = generateCopy({
      product: 'PartingWord',
      vibe: 'calm',
      category: 'general',
      objective: 'launch',
      rawPrompt: 'PartingWord.com end of life messaging platform',
      variantOffset: 1,
    });

    expect(`${base.headline}|${base.subhead}|${base.cta}`).not.toBe(
      `${variant.headline}|${variant.subhead}|${variant.cta}`
    );
  });

  it('generates offer-aware headline when objective is offer', () => {
    const result = generateCopy({
      product: 'shoes',
      offer: '30% off',
      vibe: 'energetic',
      category: 'fashion',
      objective: 'offer',
    });

    expect(result.headline.toLowerCase()).toMatch(/off|deal|save|sale|offer/);
  });

  it('avoids generic Shop Now default CTA for offers', () => {
    const result = generateCopy({
      product: 'sneakers',
      offer: '20% off',
      vibe: 'energetic',
      category: 'fashion',
      objective: 'offer',
    });

    expect(result.cta).not.toBe('Shop Now');
    expect(result.cta.length).toBeLessThanOrEqual(CHAR_LIMITS.cta);
  });

  it('generates category-aware CTA for travel', () => {
    const result = generateCopy({
      product: 'vacation package',
      vibe: 'calm',
      category: 'travel',
      objective: 'awareness',
    });

    expect(['Plan Your Escape', 'Start Planning', 'Explore Stays']).toContain(result.cta);
  });

  it('generates subhead distinct from headline', () => {
    const result = generateCopy({
      product: 'laptop',
      offer: '15% off',
      vibe: 'minimal',
      category: 'tech',
      objective: 'offer',
    });

    expect(result.subhead).not.toBe(result.headline);
    expect(result.subhead.length).toBeGreaterThan(0);
  });

  it('respects headline character limit', () => {
    const result = generateCopy({
      product: 'super deluxe premium ultra wireless noise cancelling headphones',
      vibe: 'minimal',
      category: 'tech',
      objective: 'awareness',
    });

    expect(result.headline.length).toBeLessThanOrEqual(CHAR_LIMITS.headline);
  });

  it('respects subhead character limit', () => {
    const result = generateCopy({
      product: 'amazing product',
      vibe: 'energetic',
      category: 'general',
      objective: 'awareness',
    });

    expect(result.subhead.length).toBeLessThanOrEqual(CHAR_LIMITS.subhead);
  });

  it('respects CTA character limit', () => {
    const result = generateCopy({
      product: 'product',
      vibe: 'energetic',
      category: 'general',
      objective: 'launch',
    });

    expect(result.cta.length).toBeLessThanOrEqual(CHAR_LIMITS.cta);
  });

  it('generates relevant compassionate copy for PartingWord context', () => {
    const result = generateCopy({
      product: 'PartingWord',
      vibe: 'calm',
      category: 'general',
      objective: 'launch',
      rawPrompt: 'PartingWord.com end of life messaging platform for loved ones',
    });

    expect(result.headline.toLowerCase()).toMatch(/messages|words|voice|meaningful/);
    expect(result.subhead.toLowerCase()).toMatch(/legacy|loved|message|end-of-life|trusted|future|guidance|memories|love/);
    expect(result.cta.length).toBeLessThanOrEqual(CHAR_LIMITS.cta);
    expect(result.cta.toLowerCase()).toMatch(/message|process|care|write|learn|start|plan|begin/);
  });

  it('avoids discount-store CTA language in compassionate mode', () => {
    const result = generateCopy({
      product: 'legacy messaging app',
      vibe: 'calm',
      category: 'general',
      objective: 'awareness',
      rawPrompt: 'end of life legacy communication platform',
    });

    expect(result.cta.toLowerCase()).not.toMatch(/deal|save|shop|buy|drop/);
  });

  it('can use a short website as CTA in non-subtle offer contexts', () => {
    const result = generateCopy({
      product: 'training camp',
      offer: '20% off',
      vibe: 'energetic',
      category: 'fitness',
      objective: 'offer',
      rawPrompt: '20% off training camp at ace.co this weekend',
    });

    expect(result.brandMention?.mode).toBe('cta');
    expect(result.cta.length).toBeLessThanOrEqual(CHAR_LIMITS.cta);
    expect(result.cta.toLowerCase()).toMatch(/ace|visit/);
  });

  it('keeps long-domain mentions subtle without degrading subhead quality', () => {
    const result = generateCopy({
      product: 'basketball showcase',
      vibe: 'professional',
      category: 'fitness',
      objective: 'launch',
      rawPrompt: 'ClearPathAthletics.com basketball showcase registration',
    });

    expect(['none', 'subhead']).toContain(result.brandMention?.mode);
    expect(result.subhead.toLowerCase()).not.toBe('at clearpathathletics.com.');
  });

  it('keeps compassionate brand mentions subtle instead of forcing domain CTA', () => {
    const result = generateCopy({
      product: 'PartingWord',
      vibe: 'calm',
      category: 'general',
      objective: 'awareness',
      rawPrompt: 'PartingWord.com end of life messaging platform for loved ones',
    });

    expect(result.brandMention?.mode).not.toBe('cta');
    expect(result.cta.toLowerCase()).not.toMatch(/\.com|visit/);
  });

  it('generates caregiver-specific compassionate copy', () => {
    const result = generateCopy({
      product: 'PartingWord',
      vibe: 'calm',
      category: 'general',
      objective: 'awareness',
      rawPrompt: 'PartingWord for caregivers and family coordinators with practical care instructions',
    });

    expect(result.subhead.toLowerCase()).toMatch(/care|guidance|family|notes|instructions|coordinator/);
  });

  it('does not inject ellipsis in generated compassionate copy', () => {
    const result = generateCopy({
      product: 'PartingWord',
      vibe: 'calm',
      category: 'general',
      objective: 'launch',
      rawPrompt: 'PartingWord voice and written message preservation',
    });

    expect(result.headline.includes('…')).toBe(false);
    expect(result.subhead.includes('…')).toBe(false);
    expect(result.cta.includes('…')).toBe(false);
  });

  it('uses planning-layer context to shape compassionate copy and CTA intent', () => {
    const result = generateCopy({
      product: 'PartingWord',
      vibe: 'calm',
      category: 'general',
      objective: 'awareness',
      rawPrompt: 'PartingWord.com end of life messaging platform',
      planning: {
        targetAudience: 'caregivers and family coordinators',
        narrativeMoment: 'preparing guidance for future care decisions',
        copyStrategy: 'Lead with clarity and reassurance, then low-friction action.',
        ctaPriority: 'low',
        keyPhrases: ['care notes', 'family coordinators', 'guidance'],
      },
    });

    expect(result.planningDriven).toBe(true);
    expect(result.planningRationale?.length).toBeGreaterThan(0);
    expect(result.subhead.toLowerCase()).toMatch(/guidance|care|secure|trusted|family|caregivers/);
    expect(result.cta.toLowerCase()).not.toMatch(/shop|buy|deal|save/);
  });
});

describe('validateCopy', () => {
  it('returns valid for proper copy', () => {
    const copy = {
      headline: 'Short Headline',
      subhead: 'A slightly longer subhead that still fits the limit.',
      cta: 'Learn More',
      formula: 'benefit' as const,
    };

    const result = validateCopy(copy);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error for too-long headline', () => {
    const copy = {
      headline: 'This is a very long headline that definitely exceeds the character limit for this engine',
      subhead: 'Normal subhead',
      cta: 'Learn More',
      formula: 'benefit' as const,
    };

    const result = validateCopy(copy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Headline'))).toBe(true);
  });

  it('returns error for too-long subhead', () => {
    const copy = {
      headline: 'Normal',
      subhead: 'This subhead intentionally exceeds the character limit by being dramatically long and repetitive for testing.',
      cta: 'Learn More',
      formula: 'benefit' as const,
    };

    const result = validateCopy(copy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Subhead'))).toBe(true);
  });

  it('returns error for too-long CTA', () => {
    const copy = {
      headline: 'Normal',
      subhead: 'Normal subhead',
      cta: 'This CTA is definitely too long',
      formula: 'benefit' as const,
    };

    const result = validateCopy(copy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('CTA'))).toBe(true);
  });
});

describe('CHAR_LIMITS', () => {
  it('uses tuned limits for ad readability', () => {
    expect(CHAR_LIMITS.headline).toBe(34);
    expect(CHAR_LIMITS.subhead).toBe(62);
    expect(CHAR_LIMITS.cta).toBe(16);
  });
});

describe('intent-based copy strategy', () => {
  const baseInput = {
    product: 'sneakers',
    vibe: 'energetic',
    category: 'fashion',
  };

  it('accepts optional intent field', () => {
    const result = generateCopy({ ...baseInput, intent: 'conversion' });
    expect(result).toBeDefined();
    expect(result.headline.length).toBeGreaterThan(0);
  });

  it('retargeting intent uses retargeting CTA candidates', () => {
    const results = Array.from({ length: 10 }, (_, i) =>
      generateCopy({ ...baseInput, intent: 'retargeting', variantOffset: i })
    );
    const allCtas = results.map((r) => r.cta);
    const hasRetargetingCta = allCtas.some((cta) =>
      RETARGETING_CTA_CANDIDATES.some((rc) => rc === cta)
    );
    expect(hasRetargetingCta).toBe(true);
  });

  it('retargeting CTA candidates include at least 3 retargeting-specific options', () => {
    expect(RETARGETING_CTA_CANDIDATES.length).toBeGreaterThanOrEqual(3);
    expect(RETARGETING_CTA_CANDIDATES).toContain('Come Back');
    expect(RETARGETING_CTA_CANDIDATES).toContain('Still Interested?');
    expect(RETARGETING_CTA_CANDIDATES).toContain('Complete Order');
  });

  it('retargeting intent produces different formulas than conversion', () => {
    const retargetingResults = Array.from({ length: 5 }, (_, i) =>
      generateCopy({ ...baseInput, intent: 'retargeting', variantOffset: i })
    );
    const conversionResults = Array.from({ length: 5 }, (_, i) =>
      generateCopy({ ...baseInput, intent: 'conversion', variantOffset: i })
    );

    const retargetingFormulas = new Set(retargetingResults.map((r) => r.formula));
    const conversionFormulas = new Set(conversionResults.map((r) => r.formula));

    // Retargeting should prefer proof/benefit/question, not urgency/number
    expect(retargetingFormulas.has('urgency')).toBe(false);
    // Conversion should prefer urgency/number/benefit
    expect(
      conversionFormulas.has('urgency') || conversionFormulas.has('number')
    ).toBe(true);
  });

  it('awareness intent prefers benefit/curiosity/question formulas', () => {
    const results = Array.from({ length: 10 }, (_, i) =>
      generateCopy({ ...baseInput, intent: 'awareness', variantOffset: i })
    );
    const formulas = new Set(results.map((r) => r.formula));
    const allowed = new Set(['benefit', 'curiosity', 'question']);
    for (const f of formulas) {
      expect(allowed.has(f)).toBe(true);
    }
  });

  it('conversion intent uses conversion CTA candidates', () => {
    const results = Array.from({ length: 10 }, (_, i) =>
      generateCopy({ ...baseInput, intent: 'conversion', variantOffset: i })
    );
    const conversionCtas = ['Buy Now', 'Get Started', 'Claim Offer', 'Save Today'];
    const allCtas = results.map((r) => r.cta);
    const hasConversionCta = allCtas.some((cta) => conversionCtas.includes(cta));
    expect(hasConversionCta).toBe(true);
  });

  it('all intent-driven outputs respect character limits', () => {
    const intents = ['conversion', 'awareness', 'retargeting'] as const;
    for (const intent of intents) {
      for (let i = 0; i < 5; i++) {
        const result = generateCopy({ ...baseInput, intent, variantOffset: i });
        expect(result.headline.length).toBeLessThanOrEqual(CHAR_LIMITS.headline);
        expect(result.subhead.length).toBeLessThanOrEqual(CHAR_LIMITS.subhead);
        expect(result.cta.length).toBeLessThanOrEqual(CHAR_LIMITS.cta);
      }
    }
  });

  it('without intent, existing behavior is preserved', () => {
    const withoutIntent = generateCopy({ ...baseInput, objective: 'offer', offer: '20% off' });
    const withIntent = generateCopy({ ...baseInput, objective: 'offer', offer: '20% off', intent: 'retargeting' });
    // Different formulas expected
    expect(withoutIntent.formula).not.toBe(withIntent.formula);
  });
});
