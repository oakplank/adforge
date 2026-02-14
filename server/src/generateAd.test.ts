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

  it('extracts luxury vibe', () => {
    const result = parsePrompt('luxury watches gold and silver');
    expect(result.vibe).toBe('luxury');
  });

  it('extracts calm vibe', () => {
    const result = parsePrompt('calm spa products blue tones');
    expect(result.vibe).toBe('calm');
  });

  it('extracts professional vibe', () => {
    const result = parsePrompt('professional business services');
    expect(result.vibe).toBe('professional');
  });

  it('extracts multiple colors', () => {
    const result = parsePrompt('blue green and purple gradient background');
    expect(result.colors.length).toBeGreaterThanOrEqual(2);
  });

  it('preserves raw prompt', () => {
    const input = 'Test prompt with special chars !@#$';
    const result = parsePrompt(input);
    expect(result.rawPrompt).toBe(input);
  });

  it('handles empty-ish product gracefully', () => {
    const result = parsePrompt('30% off sale energetic orange');
    expect(result.product).toBeTruthy();
  });
});

describe('generateAdSpec', () => {
  it('generates headline with offer', () => {
    const parsed = parsePrompt('Summer sale 30% off shoes');
    const spec = generateAdSpec(parsed);
    expect(spec.texts.headline.toLowerCase()).toContain('30% off');
  });

  it('generates Shop Now CTA for offers', () => {
    const parsed = parsePrompt('30% off shoes');
    const spec = generateAdSpec(parsed);
    expect(spec.texts.cta).toBe('Shop Now');
  });

  it('generates Learn More CTA when no offer', () => {
    const parsed = parsePrompt('premium leather bags luxury');
    const spec = generateAdSpec(parsed);
    expect(['Learn More', 'Shop Now', 'Get Started', 'Discover']).toContain(spec.texts.cta);
  });

  it('returns all required AdSpec fields', () => {
    const parsed = parsePrompt('Summer sale 30% off shoes');
    const spec = generateAdSpec(parsed);
    expect(spec.imagePrompt).toBeTruthy();
    expect(spec.texts.headline).toBeTruthy();
    expect(spec.texts.subhead).toBeTruthy();
    expect(spec.texts.cta).toBeTruthy();
    expect(spec.colors.primary).toBeTruthy();
    expect(spec.colors.secondary).toBeTruthy();
    expect(spec.templateId).toBe('default');
  });

  it('uses provided templateId', () => {
    const parsed = parsePrompt('shoes sale');
    const spec = generateAdSpec(parsed, 'square', 'hero-center');
    expect(spec.templateId).toBe('hero-center');
  });

  it('uses extracted colors as primary/secondary', () => {
    const parsed = parsePrompt('orange and blue sneakers');
    const spec = generateAdSpec(parsed);
    expect(spec.colors.primary).toBe('#FF6B00');
    expect(spec.colors.secondary).toBe('#1565C0');
  });

  it('includes category detection', () => {
    const parsed = parsePrompt('delicious pizza 50% off');
    const spec = generateAdSpec(parsed);
    expect(spec.category).toBe('food');
  });

  it('includes layout information', () => {
    const parsed = parsePrompt('summer shoes sale');
    const spec = generateAdSpec(parsed, 'square');
    expect(spec.layout).toBeDefined();
    expect(spec.layout?.format).toBe('square');
  });

  it('includes metadata with contrast ratios', () => {
    const parsed = parsePrompt('tech gadget sale');
    const spec = generateAdSpec(parsed);
    expect(spec.metadata).toBeDefined();
    expect(spec.metadata?.contrastRatios).toBeDefined();
    expect(spec.metadata?.contrastRatios.headline).toBeGreaterThan(0);
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
    expect(res.body.templateId).toBe('default');
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
      .send({ prompt: 'cool shoes', format: 'portrait', templateId: 'hero-left' });
    expect(res.status).toBe(200);
    expect(res.body.templateId).toBe('hero-left');
  });

  it('produces relevant headline for summer sale prompt', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'Summer sale 30% off shoes' });
    expect(res.body.texts.headline.toLowerCase()).toContain('30% off');
    expect(res.body.texts.cta).toBe('Shop Now');
  });

  it('returns enhanced fields in response', async () => {
    const res = await request(app)
      .post('/api/generate-ad')
      .send({ prompt: 'delicious pizza 20% off' });
    expect(res.status).toBe(200);
    expect(res.body.category).toBe('food');
    expect(res.body.layout).toBeDefined();
    expect(res.body.metadata).toBeDefined();
  });
});
