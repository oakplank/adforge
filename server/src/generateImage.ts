import { Router, Request, Response } from 'express';

// Basic in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const DEFAULT_IMAGE_MODEL = 'gemini-3-pro-image-preview';

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

export class NanoBananaClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private sanitizeModel(model?: string): string {
    if (!model) return DEFAULT_IMAGE_MODEL;
    if (!/^[a-zA-Z0-9._-]+$/.test(model)) return DEFAULT_IMAGE_MODEL;
    return model;
  }

  async generateImage(
    prompt: string,
    width: number,
    height: number,
    enhancedPrompt?: string,
    systemPrompt?: string,
    model?: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('NANO_BANANA_API_KEY is not configured');
    }

    const selectedModel = this.sanitizeModel(model);
    const finalPrompt =
      enhancedPrompt?.trim() ||
      `Generate an image: ${prompt}. The image should be ${width}x${height} pixels, premium quality, professional advertising style.`;

    const payload: Record<string, unknown> = {
      contents: [
        {
          parts: [{ text: finalPrompt }],
        },
      ],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    };

    if (systemPrompt?.trim()) {
      payload.systemInstruction = { parts: [{ text: systemPrompt.trim() }] };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        throw new Error(`Gemini API returned ${response.status}: ${text}`);
      }

      const data = await response.json() as any;
      const candidates = data.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates in Gemini response');
      }

      for (const candidate of candidates) {
        const parts = candidate.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }

      throw new Error('No image data found in Gemini response');
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createGenerateImageRouter(client?: NanoBananaClient): Router {
  const router = Router();

  const imageClient = client ?? (() => {
    const apiKey = process.env.NANO_BANANA_API_KEY;
    if (!apiKey) {
      console.warn('NANO_BANANA_API_KEY not set - image generation will fail');
    }
    return new NanoBananaClient(apiKey ?? '');
  })();

  router.post('/api/generate-image', async (req: Request, res: Response) => {
    const ip = req.ip ?? 'unknown';
    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
      return;
    }

    const { prompt, width, height, enhancedPrompt, systemPrompt, model } = req.body;
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
      const ep = enhancedPrompt && typeof enhancedPrompt === 'string' ? enhancedPrompt.trim() : undefined;
      const sp = systemPrompt && typeof systemPrompt === 'string' ? systemPrompt.trim() : undefined;
      const selectedModel = model && typeof model === 'string' ? model.trim() : undefined;
      const result = await imageClient.generateImage(prompt.trim(), w, h, ep, sp, selectedModel);

      if (result.startsWith('data:')) {
        const base64 = result.split(',')[1];
        res.json({ imageBase64: base64, mimeType: 'image/png', model: selectedModel ?? DEFAULT_IMAGE_MODEL });
      } else if (result.startsWith('http')) {
        res.json({ imageUrl: result, model: selectedModel ?? DEFAULT_IMAGE_MODEL });
      } else {
        res.json({ imageBase64: result, model: selectedModel ?? DEFAULT_IMAGE_MODEL });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image generation failed';
      console.error('Image generation error:', message);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
