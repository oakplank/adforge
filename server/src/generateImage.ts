import { Router, Request, Response } from 'express';

// Basic in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const DEFAULT_IMAGE_MODEL = process.env.NANO_BANANA_MODEL || 'gemini-3-pro-image-preview';
const DEFAULT_QA_MODEL = process.env.NANO_BANANA_QA_MODEL || DEFAULT_IMAGE_MODEL;
const MAX_QUALITY_ATTEMPTS = 3;

interface ImageQualityReport {
  approved: boolean;
  score: number;
  issues: string[];
  correctionPrompt: string;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseImageDataUri(imageDataUri: string): { mimeType: string; data: string } | null {
  const match = imageDataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function hasCriticalQualityIssue(lines: string[]): boolean {
  const combined = lines.join(' ').toLowerCase();
  return /visible text|legible text|logo|watermark|ui glyph|quote overlay|split panel|split-screen|vertical wipe|letterbox|matte border|hard-edge|hard edge|not full-bleed|not full bleed|border around/.test(combined);
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

  private sanitizeQaModel(model: string): string {
    if (!/^[a-zA-Z0-9._-]+$/.test(model)) return DEFAULT_QA_MODEL;
    return model;
  }

  private normalizeQualityReport(raw: any): ImageQualityReport {
    const scoreRaw = typeof raw?.score === 'number' ? raw.score : Number(raw?.score);
    let score = Number.isFinite(scoreRaw) ? clampScore(scoreRaw) : 50;
    const issues = Array.isArray(raw?.issues)
      ? raw.issues.filter((entry: unknown) => typeof entry === 'string').slice(0, 6)
      : [];
    const correctionPrompt =
      typeof raw?.correctionPrompt === 'string'
        ? raw.correctionPrompt.trim()
        : 'Use one coherent full-bleed scene with natural negative space and no visible text artifacts.';
    const critical = hasCriticalQualityIssue([...issues, correctionPrompt]);
    if (critical) {
      score = Math.min(score, 79);
    }

    return {
      approved: !critical && (Boolean(raw?.approved) || score >= 82),
      score,
      issues,
      correctionPrompt,
    };
  }

  private extractJsonObject(text: string): any | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenceMatch?.[1] || trimmed;
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    const jsonText = objectMatch?.[0];
    if (!jsonText) return null;

    try {
      return JSON.parse(jsonText);
    } catch {
      return null;
    }
  }

  private inferQualityFromTextResponse(text: string): ImageQualityReport {
    const normalizedText = text.trim();
    const lower = normalizedText.toLowerCase();

    const scoreMatch =
      normalizedText.match(/(?:score|rating)\s*[:=]?\s*(\d{1,3})/i) ||
      normalizedText.match(/\b(\d{1,3})\s*\/\s*100\b/i);
    const parsedScore = scoreMatch ? Number(scoreMatch[1]) : NaN;

    let score = Number.isFinite(parsedScore)
      ? clampScore(parsedScore)
      : /excellent|strong|approved|pass/.test(lower)
        ? 85
        : /poor|reject|fail|artifact|watermark|split/.test(lower)
          ? 35
          : 60;

    const lines = normalizedText
      .split('\n')
      .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
      .filter(Boolean);
    const issueLines = lines.filter((line) =>
      /issue|artifact|problem|violation|text|watermark|split|border|letterbox/i.test(line)
    );

    const correctionMatch =
      normalizedText.match(/correction(?: prompt)?\s*[:\-]\s*([^\n]+)/i) ||
      normalizedText.match(/regenerate[^.:\n]*[:\-]\s*([^\n]+)/i);

    const correctionPrompt = correctionMatch?.[1]?.trim()
      || 'Regenerate with natural full-bleed composition, no split panels, and no visible text artifacts.';

    const explicitReject = /not approved|reject|failed|do not approve|unusable/i.test(lower);
    const explicitApprove = /approved|passes?|acceptable/i.test(lower);
    if (explicitReject && score > 75) {
      score = 55;
    }
    const critical = hasCriticalQualityIssue([...issueLines, correctionPrompt, normalizedText]);
    if (critical) {
      score = Math.min(score, 79);
    }
    const approved = !critical && !explicitReject && (explicitApprove || score >= 82);

    return {
      approved,
      score,
      issues: issueLines.slice(0, 6),
      correctionPrompt,
    };
  }

  private async reviewImageQuality(
    imageDataUri: string,
    context: { prompt: string; enhancedPrompt?: string }
  ): Promise<ImageQualityReport | null> {
    const parsedImage = parseImageDataUri(imageDataUri);
    if (!parsedImage) return null;

    const qaModel = this.sanitizeQaModel(DEFAULT_QA_MODEL);
    const reviewPrompt = normalizeWhitespace(`
      You are a strict paid-social ad creative QA reviewer.
      Evaluate this generated base image for compositional quality.
      Prioritize these failures:
      1) any visible text/logos/watermarks/UI glyphs,
      2) synthetic vertical split panels or hard-edge side wipes,
      3) non-full-bleed framing or matte borders,
      4) incoherent random subject matter that breaks the prompt intent.
      User prompt: "${context.prompt}".
      Render prompt summary: "${context.enhancedPrompt || context.prompt}".
      Return JSON only with keys:
      approved (boolean),
      score (0-100),
      issues (string[]),
      correctionPrompt (single sentence for regeneration if not approved).
      Be strict.
    `);

    const payload: Record<string, unknown> = {
      contents: [
        {
          parts: [
            { text: reviewPrompt },
            { inlineData: { mimeType: parsedImage.mimeType, data: parsedImage.data } },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT'],
        temperature: 0.1,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${qaModel}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) return null;
      const data = (await response.json()) as any;

      const textParts: string[] = [];
      for (const candidate of data.candidates ?? []) {
        for (const part of candidate?.content?.parts ?? []) {
          if (typeof part?.text === 'string') {
            textParts.push(part.text);
          }
        }
      }

      if (textParts.length === 0) return null;
      const combinedText = textParts.join('\n');
      const parsed = this.extractJsonObject(combinedText);
      if (parsed) {
        return this.normalizeQualityReport(parsed);
      }
      return this.inferQualityFromTextResponse(combinedText);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
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

  async generateImageWithQualityGate(input: {
    prompt: string;
    width: number;
    height: number;
    enhancedPrompt?: string;
    systemPrompt?: string;
    model?: string;
    qualityGate?: boolean;
  }): Promise<{ image: string; model: string; attempts: number; reports: ImageQualityReport[] }> {
    const selectedModel = this.sanitizeModel(input.model);
    const qualityGateEnabled = input.qualityGate !== false;

    let attemptPrompt = input.enhancedPrompt;
    let attempts = 0;
    let fallbackImage = '';
    let fallbackScore = -1;
    const reports: ImageQualityReport[] = [];

    for (let attempt = 1; attempt <= MAX_QUALITY_ATTEMPTS; attempt += 1) {
      attempts = attempt;
      const image = await this.generateImage(
        input.prompt,
        input.width,
        input.height,
        attemptPrompt,
        input.systemPrompt,
        selectedModel
      );

      if (!qualityGateEnabled) {
        return { image, model: selectedModel, attempts, reports };
      }

      const report = await this.reviewImageQuality(image, {
        prompt: input.prompt,
        enhancedPrompt: attemptPrompt,
      });

      if (!report) {
        // Fail-open if QA model is unavailable.
        return { image, model: selectedModel, attempts, reports };
      }

      reports.push(report);
      if (report.score > fallbackScore) {
        fallbackScore = report.score;
        fallbackImage = image;
      }

      if (report.approved) {
        return { image, model: selectedModel, attempts, reports };
      }

      attemptPrompt = normalizeWhitespace([
        input.enhancedPrompt || input.prompt,
        `Quality correction pass ${attempt + 1}: ${report.correctionPrompt}`,
        'Mandatory: natural full-bleed composition, no split-screen panels, no matte borders.',
        'Mandatory: no visible text, logos, quote overlays, watermark artifacts, or UI glyphs.',
      ].join(' '));
    }

    if (fallbackImage) {
      return { image: fallbackImage, model: selectedModel, attempts, reports };
    }

    throw new Error('Image quality gate failed to produce a usable image');
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

    const { prompt, width, height, enhancedPrompt, systemPrompt, model, qualityGate } = req.body;
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
      const qualityGateEnabled = qualityGate !== false;
      const generated = await imageClient.generateImageWithQualityGate({
        prompt: prompt.trim(),
        width: w,
        height: h,
        enhancedPrompt: ep,
        systemPrompt: sp,
        model: selectedModel,
        qualityGate: qualityGateEnabled,
      });
      const result = generated.image;

      if (result.startsWith('data:')) {
        const base64 = result.split(',')[1];
        res.json({
          imageBase64: base64,
          mimeType: 'image/png',
          model: generated.model,
          qualityGate: {
            enabled: qualityGateEnabled,
            attempts: generated.attempts,
            reports: generated.reports,
          },
        });
      } else if (result.startsWith('http')) {
        res.json({
          imageUrl: result,
          model: generated.model,
          qualityGate: {
            enabled: qualityGateEnabled,
            attempts: generated.attempts,
            reports: generated.reports,
          },
        });
      } else {
        res.json({
          imageBase64: result,
          model: generated.model,
          qualityGate: {
            enabled: qualityGateEnabled,
            attempts: generated.attempts,
            reports: generated.reports,
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image generation failed';
      console.error('Image generation error:', message);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
