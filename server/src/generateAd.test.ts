import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from './app.js';
import { parsePrompt, generateAdSpec } from './generateAd.js';
import type { AdIntent } from './types/textSystem.js';

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it('detects explicit website signal when prefixed with @', () => {
    const result = parsePrompt('launch campaign for @clearpathathletics.com');
    expect(result.websiteUrl).toBe('https://clearpathathletics.com');
  });

  it('detects bare domain website signal', () => {
    const result = parsePrompt('launch campaign for clearpathathletics.com spring showcase');
    expect(result.websiteUrl).toBe('https://clearpathathletics.com');
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

  it('returns brand mention metadata when prompt contains website/brand cues', () => {
    const parsed = parsePrompt('ClearPathAthletics.com spring showcase registration');
    const spec = generateAdSpec(parsed, 'portrait');

    expect(spec.metadata?.brandMentionMode).toBeTruthy();
    expect(['none', 'cta', 'subhead', 'headline']).toContain(spec.metadata?.brandMentionMode);
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
    expect(res.body.metadata.copyPlan).toBeDefined();
    expect(typeof res.body.metadata.copyPlan.strategy).toBe('string');
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

  it('attaches website brand kit metadata when @domain trigger is used', async () => {
    const mockHtml = `
      <html>
        <head>
          <title>ClearPath Athletics</title>
          <link rel="icon" href="/logos/logo-dark.png" />
        </head>
        <body style="background:#071631;color:#63A8FF">
          <div style="color:#B3D6F6"></div>
        </body>
      </html>
    `;

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => mockHtml,
    } as unknown as Response);

    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'create launch ad for @clearpathathletics.com, energetic vibe' });

    expect(res.status).toBe(200);
    expect(res.body.metadata.brandKit).toBeTruthy();
    expect(res.body.metadata.brandKit.domain).toBe('clearpathathletics.com');
    expect(res.body.metadata.brandKit.brandName).toContain('ClearPath');
    expect(Array.isArray(res.body.metadata.brandKit.palette)).toBe(true);
    expect(typeof res.body.metadata.brandKit.contextSummary).toBe('string');
    expect(Array.isArray(res.body.metadata.brandKit.keyPhrases)).toBe(true);
    expect(res.body.metadata.promptPipeline.baseCreativeBrief).toContain('Goal:');
  });

  it('accepts optional intent field and includes it in metadata', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'Summer sale 30% off shoes', intent: 'conversion' });

    expect(res.status).toBe(200);
    expect(res.body.metadata.intent).toBe('conversion');
  });

  it('works without intent field (backward compatible)', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'Summer sale 30% off shoes' });

    expect(res.status).toBe(200);
    expect(res.body.metadata.intent).toBeUndefined();
  });

  it('ignores invalid intent values', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'Summer sale 30% off shoes', intent: 'invalid' });

    expect(res.status).toBe(200);
    expect(res.body.metadata.intent).toBeUndefined();
  });

  it('produces different copy for retargeting vs conversion intent', async () => {
    const retargetRes = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'premium headphones deal', intent: 'retargeting' });

    const conversionRes = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'premium headphones deal', intent: 'conversion' });

    expect(retargetRes.status).toBe(200);
    expect(conversionRes.status).toBe(200);

    // At least one of headline, subhead, or cta should differ
    const r = retargetRes.body.texts;
    const c = conversionRes.body.texts;
    const differs = r.headline !== c.headline || r.subhead !== c.subhead || r.cta !== c.cta;
    expect(differs).toBe(true);
  });

  it('accepts all three intent values', async () => {
    const intents: AdIntent[] = ['conversion', 'awareness', 'retargeting'];
    for (const intent of intents) {
      const res = await request(app)
        .post('/api/generate-ad')
        .send({ prompt: 'shoes sale', intent });

      expect(res.status).toBe(200);
      expect(res.body.metadata.intent).toBe(intent);
    }
  });
});

describe('generateAdSpec with intent', () => {
  it('passes intent through to metadata', () => {
    const parsed = parsePrompt('Summer sale 30% off shoes');
    const spec = generateAdSpec(parsed, 'square', undefined, 0, undefined, 'conversion');
    expect(spec.metadata?.intent).toBe('conversion');
  });

  it('retargeting and conversion produce different copy', () => {
    const parsed = parsePrompt('premium headphones deal');
    const retarget = generateAdSpec(parsed, 'square', undefined, 0, undefined, 'retargeting');
    const conversion = generateAdSpec(parsed, 'square', undefined, 0, undefined, 'conversion');

    const differs =
      retarget.texts.headline !== conversion.texts.headline ||
      retarget.texts.subhead !== conversion.texts.subhead ||
      retarget.texts.cta !== conversion.texts.cta;
    expect(differs).toBe(true);
  });
});
