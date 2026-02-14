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

  it('sends correct request to Gemini API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              inlineData: { mimeType: 'image/png', data: 'base64imagedata' }
            }]
          }
        }]
      }),
    });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('test-api-key');
    const result = await client.generateImage('test prompt', 1080, 1080);
    expect(mockFetch).toHaveBeenCalled();
    expect(result).toContain('base64imagedata');
  });

  it('returns data URL format with image', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' }
            }]
          }
        }]
      }),
    });
    globalThis.fetch = mockFetch;

    const client = new NanoBananaClient('key');
    const result = await client.generateImage('prompt', 512, 512);
    expect(result).toBe('data:image/png;base64,iVBORw0KGgo=');
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
            parts: [{ text: 'some text' }]
          }
        }]
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
