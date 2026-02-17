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
import {
  extractWebsiteSignal,
  fetchWebsiteBrandKit,
  type WebsiteBrandKit,
} from './websiteBrandKit.js';

const DEFAULT_IMAGE_MODEL = process.env.NANO_BANANA_MODEL || 'gemini-3-pro-image-preview';
const promptVariantMap = new Map<string, number>();
const TEXT_TREATMENT_HINTS = [
  'editorial-soft',
  'quiet-minimal',
  'serif-story',
  'campaign-outline',
  'warm-label',
] as const;

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
    brandMentionMode?: 'none' | 'cta' | 'subhead' | 'headline';
    brandMentionValue?: string;
    brandKit?: {
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
    };
    contrastRatios: {
      headline: number;
      subhead: number;
      cta: number;
    };
    formatConfig: FormatConfig;
    copyVariantIndex: number;
    textTreatmentHintId: string;
    copyPlan?: {
      planningDriven: boolean;
      rationale: string[];
      strategy: string;
    };
  };
}

interface ParsedPrompt {
  product: string;
  offer: string;
  vibe: string;
  colors: string[];
  rawPrompt: string;
  websiteUrl?: string;
}

export function parsePrompt(prompt: string): ParsedPrompt {
  const lower = prompt.toLowerCase();
  const websiteUrl = extractWebsiteSignal(prompt);

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
  let product = prompt.split(/[,;]|(?:\.\s+)/)[0] || prompt;
  product = product.replace(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/gi, ' ');
  product = product.replace(/@/g, ' ');
  if (offer) product = product.replace(new RegExp(offer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
  product = product.replace(/\b(for|targeting)\s+[a-z0-9][a-z0-9\s-]{2,45}$/i, '');
  for (const v of vibeKeywords) product = product.replace(new RegExp(`\\b${v}\\b`, 'gi'), '');
  for (const c of Object.keys(COLOR_NAME_MAP)) product = product.replace(new RegExp(`\\b${c}\\b`, 'gi'), '');
  product = product.replace(
    /\b(and|the|a|an|for|with|ad|vibe|sale|discount|offer|new|launch|introducing|style|look|now|today)\b/gi,
    ''
  );
  product = product.replace(/[,]+/g, ' ').replace(/\s+/g, ' ').trim();

  return { product: product || 'product', offer, vibe, colors, rawPrompt: prompt, websiteUrl };
}

function stableHash(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function resolveTextTreatmentHint(input: {
  objective: Objective;
  vibe: string;
  variantOffset: number;
  promptPipeline: PromptPipeline;
  placementHints: PlacementPlanHints;
  isCompassionateContext: boolean;
  headlineFormula: string;
}): string {
  const {
    objective,
    vibe,
    variantOffset,
    promptPipeline,
    placementHints,
    isCompassionateContext,
    headlineFormula,
  } = input;
  const tone = vibe.toLowerCase();
  const humanPresence = promptPipeline.thoughtSession.humanPresence;

  let candidates: string[];
  if (isCompassionateContext) {
    candidates =
      objective === 'offer'
        ? ['campaign-outline', 'warm-label', 'editorial-soft']
        : objective === 'launch'
          ? ['serif-story', 'warm-label', 'editorial-soft']
          : ['quiet-minimal', 'serif-story', 'warm-label'];
  } else if (objective === 'offer') {
    candidates = ['campaign-outline', 'editorial-soft', 'warm-label'];
  } else if (objective === 'launch') {
    candidates = ['editorial-soft', 'serif-story', 'campaign-outline'];
  } else {
    candidates = ['quiet-minimal', 'editorial-soft', 'warm-label'];
  }

  if (tone === 'minimal' || tone === 'professional' || tone === 'calm') {
    candidates = ['quiet-minimal', 'serif-story', ...candidates];
  }
  if (humanPresence === 'hands_only' || humanPresence === 'partial_person') {
    candidates = ['serif-story', 'warm-label', ...candidates];
  }
  if (placementHints.preferredAlignment === 'center' && objective === 'offer') {
    candidates = ['campaign-outline', ...candidates];
  }

  const deduped = Array.from(new Set(candidates)).filter((entry) =>
    (TEXT_TREATMENT_HINTS as readonly string[]).includes(entry)
  );
  if (deduped.length === 0) {
    return 'editorial-soft';
  }

  const seed = stableHash([
    promptPipeline.thoughtSession.targetAudience,
    promptPipeline.thoughtSession.narrativeMoment,
    promptPipeline.interpretiveLayer.selectedDirection,
    promptPipeline.creativeInterpretation.visualPromise,
    headlineFormula,
    String(variantOffset),
  ].join('|'));

  return deduped[seed % deduped.length];
}

function nextVariantIndex(prompt: string, format?: string, templateId?: string): number {
  const key = `${prompt.toLowerCase()}|${format || 'square'}|${templateId || 'auto'}`;
  const current = promptVariantMap.get(key) ?? -1;
  const next = (current + 1) % 997;
  promptVariantMap.set(key, next);
  return next;
}

export function generateAdSpec(
  parsed: ParsedPrompt,
  format?: string,
  templateId?: string,
  variantOffset = 0,
  brandKit?: WebsiteBrandKit
): AdSpec {
  let { product, offer, vibe, colors, rawPrompt } = parsed;
  const resolvedFormat = format ?? 'square';
  const isPartingWordPrompt = /partingword|partingword\.com|parting word|end[\s-]?of[\s-]?life messaging/i.test(rawPrompt);

  if (brandKit) {
    if (colors.length === 0 && brandKit.palette.length > 0) {
      colors = [...brandKit.palette];
    }
    if (product === 'product' || product.length < 3) {
      product = brandKit.brandName;
    }
  }
  const contextualRawPrompt = brandKit?.contextSummary
    ? `${rawPrompt}. Website context: ${brandKit.contextSummary}.`
      + `${brandKit.businessType ? ` Business type: ${brandKit.businessType}.` : ''}`
      + `${brandKit.targetAudience ? ` Target audience: ${brandKit.targetAudience}.` : ''}`
      + `${brandKit.offerings && brandKit.offerings.length > 0 ? ` Core offerings: ${brandKit.offerings.join(', ')}.` : ''}`
    : rawPrompt;

  // 1. Build strategy and prompt pipeline
  const strategy = buildPromptPipeline({
    rawPrompt: contextualRawPrompt,
    product,
    description: contextualRawPrompt,
    vibe,
    format: resolvedFormat,
    colors,
    offer: offer || undefined,
  });
  const copyPlanning = {
    targetAudience: strategy.promptPipeline.thoughtSession.targetAudience,
    narrativeMoment: strategy.promptPipeline.thoughtSession.narrativeMoment,
    copyStrategy: strategy.agenticPlan.copyStrategy,
    emotionalTone: strategy.promptPipeline.creativeInterpretation.intent,
    keyPhrases: [
      strategy.promptPipeline.interpretiveLayer.selectedDirection,
      strategy.promptPipeline.creativeInterpretation.sceneBrief,
      ...(brandKit?.keyPhrases ?? []),
    ],
    brandName: brandKit?.brandName,
    ctaPriority: strategy.placementHints.ctaPriority,
  };

  // 2. Generate copy tied to objective and category
  const copy = generateCopy({
    product,
    offer: offer || undefined,
    vibe,
    category: strategy.category,
    objective: strategy.objective,
    rawPrompt: contextualRawPrompt,
    variantOffset,
    planning: copyPlanning,
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
    accent: colors[2] ?? vibeColors.accent,
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
  const isCompassionateContext = /partingword|end[\s-]?of[\s-]?life|legacy|loved ones|grief|bereavement|after i'?m gone/i
    .test(contextualRawPrompt);
  const textTreatmentHintId = resolveTextTreatmentHint({
    objective: strategy.objective,
    vibe,
    variantOffset,
    promptPipeline: strategy.promptPipeline,
    placementHints: strategy.placementHints,
    isCompassionateContext,
    headlineFormula: copy.formula,
  });
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
      brandMentionMode: copy.brandMention?.mode,
      brandMentionValue: copy.brandMention?.value,
      brandKit: brandKit
        ? {
            sourceUrl: brandKit.sourceUrl,
            domain: brandKit.domain,
            brandName: brandKit.brandName,
            logoUrl: brandKit.logoUrl,
            palette: brandKit.palette,
            contextSummary: brandKit.contextSummary,
            keyPhrases: brandKit.keyPhrases,
            businessType: brandKit.businessType,
            targetAudience: brandKit.targetAudience,
            offerings: brandKit.offerings,
          }
        : undefined,
      contrastRatios: layout.contrastRatios,
      formatConfig: strategy.formatConfig as FormatConfig,
      copyVariantIndex: variantOffset,
      textTreatmentHintId,
      copyPlan: {
        planningDriven: Boolean(copy.planningDriven),
        rationale: copy.planningRationale ?? [
          `Audience: ${copyPlanning.targetAudience}`,
          `Narrative: ${copyPlanning.narrativeMoment}`,
        ],
        strategy: strategy.agenticPlan.copyStrategy,
      },
    },
  };
}

export function createGenerateAdRouter(): Router {
  const router = Router();

  router.post('/api/generate-ad', async (req: Request, res: Response) => {
    const { prompt, format, templateId } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid prompt' });
      return;
    }

    const normalizedPrompt = prompt.trim();
    const parsed = parsePrompt(normalizedPrompt);
    const brandKit = parsed.websiteUrl
      ? await fetchWebsiteBrandKit(parsed.websiteUrl)
      : undefined;
    const variantOffset = nextVariantIndex(normalizedPrompt, format, templateId);
    const adSpec = generateAdSpec(parsed, format, templateId, variantOffset, brandKit);
    res.json(adSpec);
  });

  return router;
}

export { VIBE_COLOR_MAP, COLOR_NAME_MAP };
