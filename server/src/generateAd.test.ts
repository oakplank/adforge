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
    expect(spec.metadata?.promptPipeline.renderPrompt).toContain('Composition strategy');
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

  it('rotates copy variant index for repeated prompt requests', async () => {
    const body = { prompt: 'PartingWord.com end of life messaging platform launch' };
    const first = await request(app).post('/api/generate-ad').send(body);
    const second = await request(app).post('/api/generate-ad').send(body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(typeof first.body.metadata.copyVariantIndex).toBe('number');
    expect(typeof second.body.metadata.copyVariantIndex).toBe('number');
    expect(second.body.metadata.copyVariantIndex).toBe((first.body.metadata.copyVariantIndex + 1) % 997);
  });
});
