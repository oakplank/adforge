import { Router, Request, Response } from 'express';
import {
  buildPromptPipeline,
  type FormatConfig,
  type Objective,
  type PromptPipeline,
  type PlacementPlanHints,
  type AgenticPlan,
} from './promptEngine.js';
import { generateCopy, validateCopy } from './copyEngine.js';
import {
  generateLayout,
  type LayoutOutput,
} from './layoutEngine.js';

const DEFAULT_IMAGE_MODEL = process.env.NANO_BANANA_MODEL || 'gemini-3-pro-image-preview';

const VIBE_COLOR_MAP: Record<string, { primary: string; secondary: string; accent: string }> = {
  energetic: { primary: '#FF6B00', secondary: '#FF9500', accent: '#FFD600' },
  calm: { primary: '#4A90D9', secondary: '#7BB3E0', accent: '#B8D4E8' },
  luxury: { primary: '#C9A84C', secondary: '#1A1A2E', accent: '#E6D5A0' },
  playful: { primary: '#FF4081', secondary: '#7C4DFF', accent: '#00E5FF' },
  professional: { primary: '#1B365D', secondary: '#4A6FA5', accent: '#E8EDF2' },
  bold: { primary: '#D32F2F', secondary: '#212121', accent: '#FFEB3B' },
  minimal: { primary: '#333333', secondary: '#F5F5F5', accent: '#000000' },
  warm: { primary: '#E65100', secondary: '#BF360C', accent: '#FFF3E0' },
  cool: { primary: '#0277BD', secondary: '#01579B', accent: '#E1F5FE' },
  fresh: { primary: '#2E7D32', secondary: '#43A047', accent: '#E8F5E9' },
};

const COLOR_NAME_MAP: Record<string, string> = {
  red: '#D32F2F', orange: '#FF6B00', yellow: '#FFD600', green: '#2E7D32',
  blue: '#1565C0', purple: '#7B1FA2', pink: '#E91E63', black: '#212121',
  white: '#FFFFFF', gold: '#C9A84C', silver: '#9E9E9E', teal: '#00897B',
};

export interface AdTexts {
  headline: string;
  subhead: string;
  cta: string;
}

export interface AdColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface AdSpec {
  imagePrompt: string;
  texts: AdTexts;
  colors: AdColors;
  templateId: string;
  category: string;
  layout?: LayoutOutput;
  metadata?: {
    objective: Objective;
    promptPipeline: PromptPipeline;
    placementHints: PlacementPlanHints;
    agenticPlan: AgenticPlan;
    model: {
      provider: 'google';
      name: string;
    };
    headlineFormula: string;
    contrastRatios: {
      headline: number;
      subhead: number;
      cta: number;
    };
    formatConfig: FormatConfig;
  };
}

interface ParsedPrompt {
  product: string;
  offer: string;
  vibe: string;
  colors: string[];
  rawPrompt: string;
}

export function parsePrompt(prompt: string): ParsedPrompt {
  const lower = prompt.toLowerCase();

  // Extract offer
  const offerPatterns = [
    /(\d+%\s*off)/i,
    /(\$\d+\s*off)/i,
    /(buy\s+one\s+get\s+one\s*(?:free)?)/i,
    /(bogo)/i,
    /(free\s+shipping)/i,
    /(half\s+price)/i,
    /(\d+\s*for\s*\d+)/i,
  ];
  let offer = '';
  for (const pat of offerPatterns) {
    const m = prompt.match(pat);
    if (m) {
      offer = m[1];
      break;
    }
  }

  // Extract vibe
  const vibeKeywords = Object.keys(VIBE_COLOR_MAP);
  let vibe = 'energetic';
  for (const v of vibeKeywords) {
    if (lower.includes(v)) {
      vibe = v;
      break;
    }
  }

  // Extract colors
  const colors: string[] = [];
  for (const [name, hex] of Object.entries(COLOR_NAME_MAP)) {
    if (lower.includes(name)) colors.push(hex);
  }

  // Extract product (focus on first clause, then strip intent/style noise)
  let product = prompt.split(/[,.]/)[0] || prompt;
  if (offer) product = product.replace(new RegExp(offer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
  product = product.replace(/\b(for|targeting)\s+[a-z0-9][a-z0-9\s-]{2,45}$/i, '');
  for (const v of vibeKeywords) product = product.replace(new RegExp(`\\b${v}\\b`, 'gi'), '');
  for (const c of Object.keys(COLOR_NAME_MAP)) product = product.replace(new RegExp(`\\b${c}\\b`, 'gi'), '');
  product = product.replace(
    /\b(and|the|a|an|for|with|vibe|sale|discount|offer|new|launch|introducing|style|look|now|today)\b/gi,
    ''
  );
  product = product.replace(/[,]+/g, ' ').replace(/\s+/g, ' ').trim();

  return { product: product || 'product', offer, vibe, colors, rawPrompt: prompt };
}

export function generateAdSpec(parsed: ParsedPrompt, format?: string, templateId?: string): AdSpec {
  const { product, offer, vibe, colors, rawPrompt } = parsed;
  const resolvedFormat = format ?? 'square';
  const isPartingWordPrompt = /partingword|partingword\.com|parting word|end[\s-]?of[\s-]?life messaging/i.test(rawPrompt);

  // 1. Build strategy and prompt pipeline
  const strategy = buildPromptPipeline({
    rawPrompt,
    product,
    description: rawPrompt,
    vibe,
    format: resolvedFormat,
    colors,
    offer: offer || undefined,
  });

  // 2. Generate copy tied to objective and category
  const copy = generateCopy({
    product,
    offer: offer || undefined,
    vibe,
    category: strategy.category,
    objective: strategy.objective,
    rawPrompt,
  });

  const copyValidation = validateCopy(copy);
  if (!copyValidation.valid) {
    console.warn('Copy validation warnings:', copyValidation.errors);
  }

  // 3. Resolve colors
  const vibeColors = VIBE_COLOR_MAP[vibe] ?? VIBE_COLOR_MAP.energetic;
  const adColors: AdColors = {
    primary: colors[0] ?? vibeColors.primary,
    secondary: colors[1] ?? vibeColors.secondary,
    accent: vibeColors.accent,
    text: '#F7F7F2',
    background: vibe === 'minimal' || vibe === 'calm' ? '#12151C' : '#151922',
  };

  if (isPartingWordPrompt) {
    adColors.primary = '#1E4D3A';
    adColors.secondary = '#F1E9DA';
    adColors.accent = '#2D6A4F';
    adColors.text = '#F6F1E7';
    adColors.background = '#132B20';
  }

  // 4. Generate fallback layout (client can override with image-aware placement plan)
  const layout = generateLayout(
    resolvedFormat,
    copy.headline,
    copy.subhead,
    copy.cta,
    adColors.background,
    adColors.accent
  );

  adColors.text = layout.textColors.headline;

  // 5. Build AdSpec
  return {
    imagePrompt: strategy.promptPipeline.baseCreativeBrief,
    texts: {
      headline: copy.headline,
      subhead: copy.subhead,
      cta: copy.cta,
    },
    colors: adColors,
    templateId: templateId ?? strategy.suggestedTemplateId,
    category: strategy.category,
    layout,
    metadata: {
      objective: strategy.objective,
      promptPipeline: strategy.promptPipeline,
      placementHints: strategy.placementHints,
      agenticPlan: strategy.agenticPlan,
      model: {
        provider: 'google',
        name: DEFAULT_IMAGE_MODEL,
      },
      headlineFormula: copy.formula,
      contrastRatios: layout.contrastRatios,
      formatConfig: strategy.formatConfig as FormatConfig,
    },
  };
}

export function createGenerateAdRouter(): Router {
  const router = Router();

  router.post('/api/generate-ad', (req: Request, res: Response) => {
    const { prompt, format, templateId } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid prompt' });
      return;
    }

    const parsed = parsePrompt(prompt.trim());
    const adSpec = generateAdSpec(parsed, format, templateId);
    res.json(adSpec);
  });

  return router;
}

export { VIBE_COLOR_MAP, COLOR_NAME_MAP };
