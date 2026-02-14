import { Router } from 'express';
// Basic in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
function checkRateLimit(ip) {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) ?? [];
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= RATE_LIMIT_MAX)
        return false;
    recent.push(now);
    rateLimitMap.set(ip, recent);
    return true;
}
export class NanoBananaClient {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async generateImage(prompt, width, height) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120_000);
        try {
            // Use Gemini 3 Pro Image for high-quality ad image generation
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                            parts: [{
                                    text: `Generate an image: ${prompt}. The image should be ${width}x${height} pixels, high quality, professional advertising style.`
                                }]
                        }],
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"],
                    }
                }),
                signal: controller.signal,
            });
            if (!response.ok) {
                const text = await response.text().catch(() => 'Unknown error');
                throw new Error(`Gemini API returned ${response.status}: ${text}`);
            }
            const data = await response.json();
            // Extract image from Gemini response
            const candidates = data.candidates;
            if (!candidates || candidates.length === 0) {
                throw new Error('No candidates in Gemini response');
            }
            const parts = candidates[0].content?.parts;
            if (!parts) {
                throw new Error('No parts in Gemini response');
            }
            // Find the inline_data part with the image
            for (const part of parts) {
                if (part.inlineData?.mimeType?.startsWith('image/')) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            throw new Error('No image data found in Gemini response');
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
export function createGenerateImageRouter(client) {
    const router = Router();
    const imageClient = client ?? (() => {
        const apiKey = process.env.NANO_BANANA_API_KEY;
        if (!apiKey) {
            console.warn('NANO_BANANA_API_KEY not set - image generation will fail');
        }
        return new NanoBananaClient(apiKey ?? '');
    })();
    router.post('/api/generate-image', async (req, res) => {
        const ip = req.ip ?? 'unknown';
        if (!checkRateLimit(ip)) {
            res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
            return;
        }
        const { prompt, width, height } = req.body;
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            res.status(400).json({ error: 'Missing or invalid prompt' });
            return;
        }
        const w = width ?? 1080;
        const h = height ?? 1080;
        if (typeof w !== 'number' || typeof h !== 'number' || w < 1 || h < 1 || w > 4096 || h > 4096) {
            res.status(400).json({ error: 'Invalid width or height (must be 1-4096)' });
            return;
        }
        try {
            console.log(`Generating image: "${prompt.trim().substring(0, 50)}..." (${w}x${h})`);
            const result = await imageClient.generateImage(prompt.trim(), w, h);
            if (result.startsWith('data:')) {
                // Data URL - extract base64
                const base64 = result.split(',')[1];
                res.json({ imageBase64: base64, mimeType: 'image/png' });
            }
            else if (result.startsWith('http')) {
                res.json({ imageUrl: result });
            }
            else {
                res.json({ imageBase64: result });
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Image generation failed';
            console.error('Image generation error:', message);
            res.status(500).json({ error: message });
        }
    });
    return router;
}
