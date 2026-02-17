/**
 * API client module – centralizes all fetch calls to the AdForge backend.
 */

// ── Request types ──────────────────────────────────────────────

export interface GenerateAdRequest {
  prompt: string;
  format: string;
  templateId?: string;
}

export interface GenerateImageRequest {
  prompt: string;
  width: number;
  height: number;
  qualityGate?: boolean;
  enhancedPrompt?: string;
  systemPrompt?: string;
  model?: string;
}

export interface SaveGenerationRequest {
  prompt: string;
  format: string;
  width: number;
  height: number;
  imagePrompt?: string;
  enhancedPrompt?: string;
  systemPrompt?: string;
  model?: string;
  adSpec: unknown;
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
}

// ── Response types ─────────────────────────────────────────────

export interface AdSpec {
  imagePrompt: string;
  texts: { headline: string; subhead: string; cta: string };
  colors: { primary: string; secondary: string; accent: string; text: string; background: string };
  templateId: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateImageResponse {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface GenerationRecord {
  id: string;
  prompt: string;
  format: string;
  width: number;
  height: number;
  createdAt: string;
  adSpec?: unknown;
  imageUrl?: string;
  [key: string]: unknown;
}

export interface SaveGenerationResponse {
  generation: GenerationRecord;
}

// ── Error type ─────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Helpers ────────────────────────────────────────────────────

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || body.message || res.statusText;
  } catch {
    return res.statusText || `Request failed with status ${res.status}`;
  }
}

async function jsonPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await parseErrorBody(res);
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

async function jsonGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const msg = await parseErrorBody(res);
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

// ── Public API ─────────────────────────────────────────────────

export async function generateAd(
  prompt: string,
  format: string,
  templateId?: string,
): Promise<AdSpec> {
  const body: GenerateAdRequest = { prompt, format };
  if (templateId) body.templateId = templateId;
  return jsonPost<AdSpec>('/api/generate-ad', body);
}

export async function generateImage(
  body: GenerateImageRequest,
): Promise<GenerateImageResponse> {
  return jsonPost<GenerateImageResponse>('/api/generate-image', body);
}

export async function fetchGenerations(): Promise<GenerationRecord[]> {
  const data = await jsonGet<{ generations: GenerationRecord[] }>('/api/generations');
  return data.generations;
}

export async function saveGeneration(
  data: SaveGenerationRequest,
): Promise<SaveGenerationResponse> {
  return jsonPost<SaveGenerationResponse>('/api/generations', data);
}
