export interface WebsiteBrandKit {
  sourceUrl: string;
  domain: string;
  brandName: string;
  logoUrl?: string;
  palette: string[];
  contextSummary: string;
  keyPhrases: string[];
  businessType?: string;
  targetAudience?: string;
  offerings?: string[];
}

const DEFAULT_RESEARCH_MODEL =
  process.env.NANO_BANANA_STRATEGY_MODEL ||
  process.env.NANO_BANANA_MODEL ||
  'gemini-3-pro-image-preview';

function normalizeDomain(raw: string): string | undefined {
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0]
    .replace(/[),.;:!?]+$/, '')
    .toLowerCase();

  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(cleaned)) return undefined;
  return cleaned;
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function brandNameFromDomain(domain: string): string {
  const root = domain.split('.')[0] || domain;
  return toTitleCase(root.replace(/[-_]+/g, ' '));
}

function absoluteUrl(baseUrl: string, maybeRelative?: string): string | undefined {
  if (!maybeRelative) return undefined;
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function cleanText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractJsonObject(text: string): any | null {
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

function extractTitleBrand(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleMatch?.[1]) return undefined;
  const title = titleMatch[1].replace(/\s+/g, ' ').trim();
  if (!title) return undefined;
  const head = title.split(/[-|•]/)[0]?.trim();
  if (!head || head.length < 2) return undefined;
  return head;
}

function extractLogoUrl(html: string, baseUrl: string): string | undefined {
  const logoImg = html.match(
    /<img[^>]+(?:alt|aria-label)=["'][^"']*(logo|brand)[^"']*["'][^>]+src=["']([^"']+)["'][^>]*>/i
  );
  if (logoImg?.[2]) {
    const resolved = absoluteUrl(baseUrl, logoImg[2]);
    if (resolved) return resolved;
  }

  const icon = html.match(
    /<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i
  );
  if (icon?.[1]) {
    const resolved = absoluteUrl(baseUrl, icon[1]);
    if (resolved) return resolved;
  }

  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (ogImage?.[1]) {
    const resolved = absoluteUrl(baseUrl, ogImage[1]);
    if (resolved) return resolved;
  }

  return undefined;
}

function scoreHexColor(hex: string): number {
  const clean = hex.replace('#', '').toUpperCase();
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const isNearBW = lum < 20 || lum > 245 || sat < 0.03;
  return isNearBW ? -3 : 1 + sat * 2;
}

export function extractPaletteFromHtml(html: string): string[] {
  const hexes = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
  const counts = new Map<string, number>();
  for (const raw of hexes) {
    const hex = raw.toUpperCase();
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }

  const ranked = [...counts.entries()]
    .map(([hex, count]) => ({
      hex,
      score: count + scoreHexColor(hex),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.hex);

  return ranked.slice(0, 6);
}

function extractVisibleText(html: string): string {
  return normalizeWhitespace(
    decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    )
  );
}

function extractMatches(html: string, pattern: RegExp, limit: number): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(html)) !== null && results.length < limit) {
    const text = cleanText(match[1] || '');
    if (!text) continue;
    if (text.length < 3) continue;
    results.push(text);
  }
  return results;
}

export function extractContextFromHtml(html: string): { summary: string; keyPhrases: string[] } {
  const h1 = extractMatches(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, 3);
  const h2 = extractMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi, 6);
  const p = extractMatches(html, /<p[^>]*>([\s\S]*?)<\/p>/gi, 12);
  const li = extractMatches(html, /<li[^>]*>([\s\S]*?)<\/li>/gi, 20);

  const preferred = [...h1, ...h2, ...p, ...li]
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 8)
    .filter((line) => line.length <= 180);

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const line of preferred) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(line);
    if (deduped.length >= 8) break;
  }

  const summary = deduped.slice(0, 4).join(' | ');
  return {
    summary,
    keyPhrases: deduped,
  };
}

async function synthesizeContextWithLlm(input: {
  domain: string;
  html: string;
  fallbackSummary: string;
  fallbackPhrases: string[];
}): Promise<{
  summary?: string;
  keyPhrases?: string[];
  businessType?: string;
  targetAudience?: string;
  offerings?: string[];
} | undefined> {
  const apiKey = process.env.NANO_BANANA_API_KEY;
  if (!apiKey) return undefined;

  const visibleText = extractVisibleText(input.html).slice(0, 12000);
  if (!visibleText) return undefined;

  const llmPrompt = normalizeWhitespace(`
    You are a brand strategist extracting business context from a website.
    Domain: ${input.domain}
    Website text sample: ${visibleText}
    Fallback context: ${input.fallbackSummary}
    Return strict JSON with keys:
    summary (string, max 220 chars),
    businessType (string),
    targetAudience (string),
    offerings (string[] max 6),
    keyPhrases (string[] max 8).
    Keep factual and concise. No markdown.
  `);

  const payload: Record<string, unknown> = {
    contents: [{ parts: [{ text: llmPrompt }] }],
    generationConfig: {
      responseModalities: ['TEXT'],
      temperature: 0.2,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_RESEARCH_MODEL}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) return undefined;
    const data = (await response.json()) as any;
    const textParts: string[] = [];
    for (const candidate of data?.candidates ?? []) {
      for (const part of candidate?.content?.parts ?? []) {
        if (typeof part?.text === 'string') {
          textParts.push(part.text);
        }
      }
    }

    const parsed = extractJsonObject(textParts.join('\n'));
    if (!parsed || typeof parsed !== 'object') return undefined;

    const summary = typeof parsed.summary === 'string' ? normalizeWhitespace(parsed.summary).slice(0, 220) : undefined;
    const businessType = typeof parsed.businessType === 'string' ? normalizeWhitespace(parsed.businessType).slice(0, 120) : undefined;
    const targetAudience = typeof parsed.targetAudience === 'string' ? normalizeWhitespace(parsed.targetAudience).slice(0, 160) : undefined;
    const offerings = Array.isArray(parsed.offerings)
      ? parsed.offerings.filter((item: unknown) => typeof item === 'string').map((item: string) => normalizeWhitespace(item)).filter(Boolean).slice(0, 6)
      : undefined;
    const keyPhrases = Array.isArray(parsed.keyPhrases)
      ? parsed.keyPhrases.filter((item: unknown) => typeof item === 'string').map((item: string) => normalizeWhitespace(item)).filter(Boolean).slice(0, 8)
      : undefined;

    return { summary, businessType, targetAudience, offerings, keyPhrases };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

export function extractWebsiteSignal(rawPrompt: string): string | undefined {
  const explicitAt = rawPrompt.match(/@((?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/i);
  if (explicitAt?.[1]) {
    const domain = normalizeDomain(explicitAt[1]);
    if (domain) return `https://${domain}`;
  }

  const explicitUrl = rawPrompt.match(/\bhttps?:\/\/[^\s]+/i);
  if (explicitUrl?.[0]) {
    const domain = normalizeDomain(explicitUrl[0]);
    if (domain) return `https://${domain}`;
  }

  const bareDomain = rawPrompt.match(
    /\b(?:www\.)?[a-z0-9-]{2,63}\.(?:com|io|co|ai|org|net|ca|us|app|dev|gg)\b/i
  );
  if (bareDomain?.[0]) {
    const domain = normalizeDomain(bareDomain[0]);
    if (domain) return `https://${domain}`;
  }

  return undefined;
}

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^\[::1\]$/,
  /^metadata\.google\.internal$/i,
];

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_HOSTNAME_PATTERNS.some((p) => p.test(hostname));
}

async function fetchTextWithTimeout(url: string, timeoutMs = 3500): Promise<string> {
  const parsed = new URL(url);
  if (isBlockedHost(parsed.hostname)) {
    throw new Error('Blocked host');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (location) {
        const redirected = new URL(location, url);
        if (isBlockedHost(redirected.hostname)) {
          throw new Error('Blocked redirect host');
        }
        const res2 = await fetch(redirected.toString(), { signal: controller.signal });
        if (!res2.ok) throw new Error(`failed with status ${res2.status}`);
        return await res2.text();
      }
    }
    if (!res.ok) {
      throw new Error(`failed with status ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWebsiteBrandKit(sourceUrl: string): Promise<WebsiteBrandKit | undefined> {
  const domain = normalizeDomain(sourceUrl);
  if (!domain) return undefined;

  const url = `https://${domain}`;
  try {
    const html = await fetchTextWithTimeout(url);
    const palette = extractPaletteFromHtml(html);
    const titleBrand = extractTitleBrand(html);
    const logoUrl = extractLogoUrl(html, url);
    const context = extractContextFromHtml(html);
    const llm = await synthesizeContextWithLlm({
      domain,
      html,
      fallbackSummary: context.summary,
      fallbackPhrases: context.keyPhrases,
    });

    const keyPhrases = llm?.keyPhrases?.length
      ? llm.keyPhrases
      : context.keyPhrases;
    const summary = llm?.summary || context.summary || keyPhrases.slice(0, 3).join(' | ');

    return {
      sourceUrl: url,
      domain,
      brandName: titleBrand || brandNameFromDomain(domain),
      logoUrl,
      palette,
      contextSummary: summary,
      keyPhrases,
      businessType: llm?.businessType,
      targetAudience: llm?.targetAudience,
      offerings: llm?.offerings,
    };
  } catch {
    return undefined;
  }
}
