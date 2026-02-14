import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NanoBananaClient } from './generateImage.js';
// Helper to create mock Gemini response
function mockGeminiResponse(imageData, mimeType = 'image/png') {
    return {
        candidates: [{
                content: {
                    parts: [{
                            inlineData: {
                                mimeType,
                                data: imageData
                            }
                        }]
                }
            }]
    };
}
describe('NanoBananaClient', () => {
    const originalFetch = globalThis.fetch;
    beforeEach(() => {
        vi.resetAllMocks();
    });
    afterEach(() => {
        globalThis.fetch = originalFetch;
    });
    it('sends correct headers and body to Gemini API', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockGeminiResponse('base64data')),
        });
        globalThis.fetch = mockFetch;
        const client = new NanoBananaClient('test-api-key');
        await client.generateImage('test prompt', 1080, 1080);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('generativelanguage.googleapis.com'), expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }));
    });
    it('returns data URL with image when API returns image data', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockGeminiResponse('iVBORw0KGgo=')),
        });
        globalThis.fetch = mockFetch;
        const client = new NanoBananaClient('key');
        const result = await client.generateImage('prompt', 512, 512);
        expect(result).toBe('data:image/png;base64,iVBORw0KGgo=');
    });
    it('returns correct mime type from response', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockGeminiResponse('imagedata', 'image/jpeg')),
        });
        globalThis.fetch = mockFetch;
        const client = new NanoBananaClient('key');
        const result = await client.generateImage('prompt', 512, 512);
        expect(result).toBe('data:image/jpeg;base64,imagedata');
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
    it('handles API errors gracefully', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: () => Promise.reject(new Error('Network error')),
        });
        globalThis.fetch = mockFetch;
        const client = new NanoBananaClient('key');
        await expect(client.generateImage('prompt', 512, 512)).rejects.toThrow('Gemini API returned 500');
    });
    it('includes prompt in request body', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockGeminiResponse('data')),
        });
        globalThis.fetch = mockFetch;
        const client = new NanoBananaClient('key');
        await client.generateImage('my test prompt', 1920, 1080);
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.contents[0].parts[0].text).toContain('my test prompt');
        expect(callBody.contents[0].parts[0].text).toContain('1920');
        expect(callBody.contents[0].parts[0].text).toContain('1080');
    });
});
