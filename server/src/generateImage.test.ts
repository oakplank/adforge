import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from './app.js';
import { NanoBananaClient } from './generateImage.js';

describe('NanoBananaClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends request to Gemini image endpoint with default model', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ inlineData: { mimeType: 'image/png', data: 'base64imagedata' } }],
          },
        }],
      }),
    });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('test-api-key');
    const result = await client.generateImage('test prompt', 1080, 1080);

    expect(result).toContain('base64imagedata');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(String(mockFetch.mock.calls[0][0])).toContain('models/gemini-3-pro-image-preview:generateContent');
  });

  it('uses enhancedPrompt when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ inlineData: { mimeType: 'image/png', data: 'enhanced123' } }],
          },
        }],
      }),
    });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('key');
    const result = await client.generateImage(
      'basic prompt',
      1080,
      1080,
      'A detailed enhanced prompt with photography direction'
    );

    expect(result).toContain('enhanced123');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.contents[0].parts[0].text).toBe('A detailed enhanced prompt with photography direction');
  });

  it('passes systemPrompt and selected model when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ inlineData: { mimeType: 'image/png', data: 'sys123' } }],
          },
        }],
      }),
    });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('key');
    await client.generateImage('basic prompt', 1080, 1080, 'enhanced', 'SYSTEM PROMPT', 'gemini-3-pro-image-preview');

    const callUrl = String(mockFetch.mock.calls[0][0]);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);

    expect(callUrl).toContain('models/gemini-3-pro-image-preview:generateContent');
    expect(body.systemInstruction.parts[0].text).toBe('SYSTEM PROMPT');
  });

  it('falls back to default model when unsafe model name is passed', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ inlineData: { mimeType: 'image/png', data: 'model123' } }],
          },
        }],
      }),
    });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('key');
    await client.generateImage('prompt', 512, 512, undefined, undefined, 'bad/model?name');

    const callUrl = String(mockFetch.mock.calls[0][0]);
    expect(callUrl).toContain('models/gemini-3-pro-image-preview:generateContent');
  });

  it('retries generation when quality gate rejects first image', async () => {
    const mockFetch = vi.fn()
      // attempt 1 image
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ inlineData: { mimeType: 'image/png', data: 'firstImage' } }],
            },
          }],
        }),
      })
      // attempt 1 QA
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: '{"approved":false,"score":35,"issues":["visible text"],"correctionPrompt":"Remove visible text and keep natural right-side negative space."}',
              }],
            },
          }],
        }),
      })
      // attempt 2 image
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ inlineData: { mimeType: 'image/png', data: 'secondImage' } }],
            },
          }],
        }),
      })
      // attempt 2 QA
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: '{"approved":true,"score":91,"issues":[],"correctionPrompt":""}' }],
            },
          }],
        }),
      });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('key');
    const result = await client.generateImageWithQualityGate({
      prompt: 'PartingWord launch creative',
      width: 1080,
      height: 1080,
      enhancedPrompt: 'Render a compassionate lifestyle scene',
      qualityGate: true,
    });

    expect(result.image).toContain('secondImage');
    expect(result.attempts).toBe(2);
    expect(result.reports).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(4);

    const secondImageBody = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(secondImageBody.contents[0].parts[0].text).toContain('Quality correction pass 2');
  });

  it('fails open when QA review is unavailable', async () => {
    const mockFetch = vi.fn()
      // attempt 1 image
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ inlineData: { mimeType: 'image/png', data: 'fallbackImage' } }],
            },
          }],
        }),
      })
      // attempt 1 QA (fails)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('QA unavailable'),
      });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('key');
    const result = await client.generateImageWithQualityGate({
      prompt: 'test prompt',
      width: 1080,
      height: 1080,
      qualityGate: true,
    });

    expect(result.image).toContain('fallbackImage');
    expect(result.attempts).toBe(1);
    expect(result.reports).toHaveLength(0);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws error when API returns non-OK status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request'),
    });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('key');
    await expect(client.generateImage('prompt', 512, 512)).rejects.toThrow('Gemini API returned 400');
  });

  it('throws error when response has no candidates', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ candidates: [] }),
    });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('key');
    await expect(client.generateImage('prompt', 512, 512)).rejects.toThrow('No candidates');
  });

  it('throws error when response has no image data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: 'some text' }],
          },
        }],
      }),
    });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('key');
    await expect(client.generateImage('prompt', 512, 512)).rejects.toThrow('No image data');
  });
});

describe('POST /api/generate-image', () => {
  it('returns 400 for missing prompt', async () => {
    const res = await request(app)
      .post('/api/generate-image')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('prompt');
  });

  it('returns 400 for empty prompt', async () => {
    const res = await request(app)
      .post('/api/generate-image')
      .send({ prompt: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid dimensions', async () => {
    const res = await request(app)
      .post('/api/generate-image')
      .send({ prompt: 'test', width: 10000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('width');
  });

  it('returns 400 for negative dimensions', async () => {
    const res = await request(app)
      .post('/api/generate-image')
      .send({ prompt: 'test', width: -100 });
    expect(res.status).toBe(400);
  });
});
