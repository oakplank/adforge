import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';
import { parsePrompt, generateAdSpec } from './generateAd.js';

describe('parsePrompt', () => {
  it('extracts offer percentage', () => {
    const result = parsePrompt('Summer sale 30% off athletic shoes');
    expect(result.offer).toBe('30% off');
  });

  it('extracts vibe', () => {
    const result = parsePrompt('energetic vibe orange shoes');
    expect(result.vibe).toBe('energetic');
  });

  it('extracts colors', () => {
    const result = parsePrompt('orange and black sneakers');
    expect(result.colors).toContain('#FF6B00');
    expect(result.colors).toContain('#212121');
  });

  it('extracts product after removing offer/vibe/colors', () => {
    const result = parsePrompt('Summer sale 30% off athletic shoes, energetic vibe, orange and black');
    expect(result.product).toBeTruthy();
    expect(result.product.length).toBeGreaterThan(0);
  });

  it('defaults vibe to energetic when none specified', () => {
    const result = parsePrompt('buy shoes now');
    expect(result.vibe).toBe('energetic');
  });

  it('handles dollar off offers', () => {
    const result = parsePrompt('$50 off premium headphones');
    expect(result.offer).toBe('$50 off');
  });

  it('extracts BOGO offer', () => {
    const result = parsePrompt('Buy one get one free pizza deal');
    expect(result.offer.toLowerCase()).toContain('buy one get one');
  });

  it('extracts free shipping offer', () => {
    const result = parsePrompt('Free shipping on all orders over $50');
    expect(result.offer.toLowerCase()).toContain('free shipping');
  });

  it('preserves raw prompt', () => {
    const input = 'Test prompt with special chars !@#$';
    const result = parsePrompt(input);
    expect(result.rawPrompt).toBe(input);
  });
});

describe('generateAdSpec', () => {
  it('generates objective-aware metadata and pipeline', () => {
    const parsed = parsePrompt('Summer sale 30% off shoes for city commuters');
    const spec = generateAdSpec(parsed, 'portrait');

    expect(spec.metadata?.objective).toBe('offer');
    expect(spec.metadata?.promptPipeline.baseCreativeBrief).toContain('Goal: offer');
    expect(spec.metadata?.promptPipeline.renderPrompt).toContain('Instagram');
    expect(spec.metadata?.promptPipeline.systemPrompt).toContain('creative director');
    expect(spec.metadata?.promptPipeline.renderPrompt).toContain('shoes');
    expect(spec.metadata?.promptPipeline.qualityChecklist.length).toBeGreaterThan(2);
    expect(spec.metadata?.placementHints).toBeDefined();
    expect(spec.metadata?.agenticPlan).toBeDefined();
  });

  it('uses strategy template by default instead of legacy default template id', () => {
    const parsed = parsePrompt('Summer sale 30% off shoes');
    const spec = generateAdSpec(parsed);
    expect(['bold-sale', 'product-showcase', 'minimal']).toContain(spec.templateId);
    expect(spec.templateId).not.toBe('default');
  });

  it('uses provided templateId override', () => {
    const parsed = parsePrompt('shoes sale');
    const spec = generateAdSpec(parsed, 'square', 'product-showcase');
    expect(spec.templateId).toBe('product-showcase');
  });

  it('returns category, layout and color payload', () => {
    const parsed = parsePrompt('delicious pizza 20% off');
    const spec = generateAdSpec(parsed, 'square');

    expect(spec.category).toBe('food');
    expect(spec.layout).toBeDefined();
    expect(spec.colors.primary).toBeTruthy();
    expect(spec.colors.secondary).toBeTruthy();
    expect(spec.colors.accent).toBeTruthy();
  });

  it('returns varied CTA language for offers (not always Shop Now)', () => {
    const parsed = parsePrompt('20% off running shoes');
    const spec = generateAdSpec(parsed, 'square');

    expect(spec.texts.cta).toBeTruthy();
    expect(spec.texts.cta.length).toBeLessThanOrEqual(18);
    expect(spec.texts.cta).not.toBe('Shop Now');
  });

  it('includes model metadata for image generation', () => {
    const parsed = parsePrompt('new skincare serum launch for sensitive skin');
    const spec = generateAdSpec(parsed, 'portrait');

    expect(spec.metadata?.model).toEqual({
      provider: 'google',
      name: 'gemini-3-pro-image-preview',
    });
  });

  it('uses PartingWord brand palette when prompt references PartingWord', () => {
    const parsed = parsePrompt('PartingWord.com end of life messaging platform launch');
    const spec = generateAdSpec(parsed, 'portrait');

    expect(spec.colors.primary).toBe('#1E4D3A');
    expect(spec.colors.secondary).toBe('#F1E9DA');
    expect(spec.colors.accent).toBe('#2D6A4F');
    expect(spec.templateId).toBe('minimal');
  });
});

describe('POST /api/generate-ad', () => {
  it('returns AdSpec for valid prompt', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'Summer sale 30% off shoes' });

    expect(res.status).toBe(200);
    expect(res.body.imagePrompt).toBeTruthy();
    expect(res.body.texts.headline).toBeTruthy();
    expect(res.body.texts.subhead).toBeTruthy();
    expect(res.body.texts.cta).toBeTruthy();
    expect(res.body.colors).toBeTruthy();
    expect(res.body.metadata).toBeTruthy();
    expect(res.body.metadata.promptPipeline.renderPrompt).toBeTruthy();
  });

  it('returns 400 for missing prompt', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('prompt');
  });

  it('returns 400 for empty prompt', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: '   ' });

    expect(res.status).toBe(400);
  });

  it('accepts format and templateId', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'cool shoes', format: 'portrait', templateId: 'minimal' });

    expect(res.status).toBe(200);
    expect(res.body.templateId).toBe('minimal');
    expect(res.body.metadata.formatConfig.height).toBe(1350);
  });

  it('ignores non-string format and templateId instead of passing them through', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'cool shoes', format: 123, templateId: { evil: true } });

    expect(res.status).toBe(200);
    // Falls back to the square default when format is not a valid string.
    expect(res.body.metadata.formatConfig.aspectRatio).toBe('1:1');
    expect(typeof res.body.templateId).toBe('string');
  });

  it('returns full strategy metadata for downstream placement', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'new cold brew maker launch for designers, calm minimal style' });

    expect(res.status).toBe(200);
    expect(res.body.metadata.objective).toBe('launch');
    expect(res.body.metadata.placementHints).toBeDefined();
    expect(res.body.metadata.agenticPlan).toBeDefined();
    expect(res.body.metadata.promptPipeline.systemPrompt).toBeTruthy();
  });

  it('honors archetypeId when provided', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'new dive watch', archetypeId: 'luxury' });

    expect(res.status).toBe(200);
    expect(res.body.archetypeId).toBe('luxury');
    // Luxury brief shapes the render prompt.
    expect(res.body.metadata.promptPipeline.renderPrompt.toLowerCase()).toContain(
      'luxury',
    );
  });

  it('falls back to general archetype for unknown archetypeId', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'new dive watch', archetypeId: 'not-a-real-archetype' });

    expect(res.status).toBe(200);
    expect(res.body.archetypeId).toBe('general');
  });
});

describe('GET /api/archetypes', () => {
  it('returns the archetype catalog', async () => {
    const res = await request(app).get('/api/archetypes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.archetypes)).toBe(true);
    expect(res.body.archetypes.length).toBeGreaterThan(3);
    for (const a of res.body.archetypes) {
      expect(typeof a.id).toBe('string');
      expect(typeof a.label).toBe('string');
      expect(typeof a.description).toBe('string');
    }
    // General should not be in the user-facing picker.
    expect(res.body.archetypes.map((a: { id: string }) => a.id)).not.toContain(
      'general',
    );
  });
});
