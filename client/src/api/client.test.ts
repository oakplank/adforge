import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateAd,
  generateImage,
  fetchGenerations,
  saveGeneration,
  ApiError,
} from './client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ── generateAd ─────────────────────────────────────────────────

describe('generateAd', () => {
  it('sends correct request and returns AdSpec', async () => {
    const adSpec = { imagePrompt: 'test', texts: {}, colors: {}, templateId: 't1' };
    mockFetch.mockResolvedValueOnce(jsonResponse(adSpec));

    const result = await generateAd('sell shoes', 'square', 'tpl-1');

    expect(mockFetch).toHaveBeenCalledWith('/api/generate-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'sell shoes', format: 'square', templateId: 'tpl-1' }),
    });
    expect(result).toEqual(adSpec);
  });

  it('omits templateId when not provided', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    await generateAd('p', 'story');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ prompt: 'p', format: 'story' });
    expect(body.templateId).toBeUndefined();
  });

  it('throws ApiError on failure with server message', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'Bad prompt' }, 400));
    await expect(generateAd('x', 'y')).rejects.toThrow('Bad prompt');
  });

  it('throws ApiError with status code', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'nope' }, 422));
    try {
      await generateAd('x', 'y');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(422);
    }
  });
});

// ── generateImage ──────────────────────────────────────────────

describe('generateImage', () => {
  it('sends correct request shape', async () => {
    const imgResp = { imageBase64: 'abc123' };
    mockFetch.mockResolvedValueOnce(jsonResponse(imgResp));

    const result = await generateImage({ prompt: 'cat', width: 1080, height: 1080 });

    expect(mockFetch).toHaveBeenCalledWith('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'cat', width: 1080, height: 1080 }),
    });
    expect(result).toEqual(imgResp);
  });

  it('throws ApiError on 500', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'GPU OOM' }, 500));
    await expect(generateImage({ prompt: 'x', width: 1, height: 1 })).rejects.toThrow('GPU OOM');
  });
});

// ── fetchGenerations ───────────────────────────────────────────

describe('fetchGenerations', () => {
  it('returns generations array from wrapper', async () => {
    const gens = [{ id: '1', prompt: 'a', format: 'square', width: 100, height: 100, createdAt: '' }];
    mockFetch.mockResolvedValueOnce(jsonResponse({ generations: gens }));

    const result = await fetchGenerations();
    expect(mockFetch).toHaveBeenCalledWith('/api/generations');
    expect(result).toEqual(gens);
  });

  it('throws on error', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 500));
    await expect(fetchGenerations()).rejects.toBeInstanceOf(ApiError);
  });
});

// ── saveGeneration ─────────────────────────────────────────────

describe('saveGeneration', () => {
  it('posts generation data and returns response', async () => {
    const payload = { prompt: 'test', format: 'square', width: 1080, height: 1080, adSpec: {} };
    const resp = { generation: { id: 'g1', ...payload, createdAt: '' } };
    mockFetch.mockResolvedValueOnce(jsonResponse(resp));

    const result = await saveGeneration(payload);
    expect(result).toEqual(resp);
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.prompt).toBe('test');
  });
});

// ── Error handling edge cases ──────────────────────────────────

describe('error handling', () => {
  it('falls back to statusText when JSON parsing fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: () => Promise.reject(new Error('not json')),
    });
    await expect(generateAd('x', 'y')).rejects.toThrow('Bad Gateway');
  });

  it('uses message field if error field missing', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'rate limited' }, 429));
    // Need fresh call since previous mockFetch was consumed
    mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'rate limited' }, 429));
    await expect(generateAd('x', 'y')).rejects.toThrow('rate limited');
  });
});
