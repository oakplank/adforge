// Prompt Engine - transform user intent into strategy + model-ready prompts.
// Static presets (formats, categories, styles, archetypes) live in
// promptEngineData.ts; this file holds the logic that consumes them.

import {
  CATEGORY_CONFIGS,
  CATEGORY_KEYWORDS,
  FORMAT_CONFIGS,
  OBJECTIVE_STRATEGIES,
  PARTINGWORD_BRAND,
  STYLE_PROFILES,
  type BrandProfile,
  type FormatConfig,
  type ObjectiveStrategy,
  type StyleProfile,
} from './promptEngineData.js';

export {
  CATEGORY_CONFIGS,
  FORMAT_CONFIGS,
  type FormatConfig,
} from './promptEngineData.js';

export type Objective = 'offer' | 'launch' | 'awareness';

export interface PromptPipeline {
  rawPrompt: string;
  baseCreativeBrief: string;
  renderPrompt: string;
  systemPrompt: string;
  styleProfileId: string;
  styleProfileName: string;
  qualityChecklist: string[];
}

export interface PlacementPlanHints {
  preferredAlignment?: 'left' | 'center' | 'right' | 'auto';
  preferredHeadlineBand?: 'top' | 'upper';
  avoidCenter?: boolean;
  ctaPriority?: 'high' | 'medium' | 'low';
}

export interface AgenticPlan {
  preflightChecklist: string[];
  postImageChecklist: string[];
  placementHypothesis: string;
  copyStrategy: string;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function inferAudience(description: string): string | undefined {
  const patterns = [
    /\bfor\s+([a-z0-9][a-z0-9\s-]{2,45}?)(?:,|\.|;| with| who|$)/i,
    /\btarget(?:ed|ing)?\s+(?:at|to)\s+([a-z0-9][a-z0-9\s-]{2,45}?)(?:,|\.|;| with|$)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (!match || !match[1]) continue;
    const audience = normalizeWhitespace(match[1]).replace(/\b(the|a|an)\b/gi, '').trim();
    if (audience.length >= 3) return audience;
  }

  return undefined;
}

function hasOfferLanguage(text: string): boolean {
  return /(off|sale|discount|deal|save|bogo|buy one|get one|coupon|free shipping|limited time|today only)/i.test(text);
}

function resolveObjectiveStrategy(objective: Objective): ObjectiveStrategy {
  if (objective === 'offer') return OBJECTIVE_STRATEGIES.conversion;
  if (objective === 'launch') return OBJECTIVE_STRATEGIES.engagement;
  return OBJECTIVE_STRATEGIES.awareness;
}

function detectBrandProfile(rawPrompt: string, description: string): BrandProfile | undefined {
  const text = `${rawPrompt} ${description}`.toLowerCase();
  if (
    /partingword|partingword\.com|parting word|end[\s-]?of[\s-]?life messaging|legacy messaging/.test(text)
  ) {
    return PARTINGWORD_BRAND;
  }

  return undefined;
}

function withBrandPalette(colors: string[] | undefined, brand?: BrandProfile): string[] | undefined {
  if (!brand) return colors;
  const palette = [brand.primaryColor, brand.secondaryColor, ...(colors ?? [])];
  const unique = [...new Set(palette.map((entry) => entry.toUpperCase()))];
  return unique;
}

export function detectObjective(description: string, offer?: string): Objective {
  const text = `${description} ${offer ?? ''}`;

  if (offer || hasOfferLanguage(text)) return 'offer';
  if (/\b(new|launch|drop|debut|introducing|just released)\b/i.test(text)) return 'launch';
  return 'awareness';
}

function resolveStyleProfile(vibe: string, category: string, brand?: BrandProfile): StyleProfile {
  if (brand?.styleProfileOverride) {
    return STYLE_PROFILES[brand.styleProfileOverride];
  }

  const vibeKey = vibe.toLowerCase();
  if (STYLE_PROFILES[vibeKey]) return STYLE_PROFILES[vibeKey];

  if (category === 'jewelry' || category === 'beauty') return STYLE_PROFILES.luxury;
  if (category === 'tech') return STYLE_PROFILES.cool;
  if (category === 'food' || category === 'home') return STYLE_PROFILES.warm;
  return STYLE_PROFILES.energetic;
}

function selectTemplateId(objective: Objective, category: string, vibe: string, brand?: BrandProfile): string {
  if (brand?.id === 'partingword') return 'minimal';
  if (objective === 'offer') return 'bold-sale';
  if (objective === 'launch') {
    return ['tech', 'beauty', 'jewelry', 'automotive'].includes(category)
      ? 'product-showcase'
      : 'minimal';
  }

  if (['minimal', 'professional', 'calm', 'luxury'].includes(vibe.toLowerCase())) return 'minimal';
  return 'product-showcase';
}

function derivePlacementHints(objective: Objective, vibe: string, brand?: BrandProfile): PlacementPlanHints {
  if (brand) {
    return {
      preferredAlignment: brand.preferredAlignment,
      preferredHeadlineBand: 'upper',
      avoidCenter: true,
      ctaPriority: objective === 'offer' ? 'high' : 'medium',
    };
  }

  const vibeKey = vibe.toLowerCase();
  const align =
    vibeKey === 'minimal' || vibeKey === 'professional'
      ? 'left'
      : objective === 'offer'
        ? 'center'
        : 'auto';

  return {
    preferredAlignment: align,
    preferredHeadlineBand: objective === 'awareness' ? 'upper' : 'top',
    avoidCenter: objective !== 'offer',
    ctaPriority: objective === 'offer' ? 'high' : objective === 'launch' ? 'medium' : 'low',
  };
}

function buildQualityChecklist(
  formatConfig: FormatConfig,
  objective: Objective,
  profile: StyleProfile,
  brand?: BrandProfile
): string[] {
  const top = Math.round(formatConfig.safeZoneTop * 100);
  const bottom = Math.round(formatConfig.safeZoneBottom * 100);

  const checklist = [
    `Keep the top ${top}% and bottom ${bottom}% visually quiet for overlay text.`,
    `One clear focal subject; premium look, no stock-photo energy.`,
    `Objective focus: ${objective}.`,
    `Styling restraint: avoid ${profile.avoidSignals.join(', ')}.`,
  ];

  if (brand) {
    checklist.push(`Honor brand palette with ${brand.primaryColor} and ${brand.secondaryColor}.`);
  }

  return checklist;
}

function buildAgenticPlan(
  objective: Objective,
  category: string,
  styleProfile: StyleProfile,
  brand?: BrandProfile
): AgenticPlan {
  const brandLine = brand
    ? `Anchor visuals to ${brand.name} (${brand.website}) and preserve brand dignity.`
    : '';

  return {
    preflightChecklist: [
      `Clarify objective: ${objective}.`,
      `Detect category: ${category}.`,
      `Apply style profile: ${styleProfile.name}.`,
      brandLine,
      `Reserve clean text bands before rendering.`,
    ].filter(Boolean),
    postImageChecklist: [
      'Evaluate top/upper zone clutter for headline legibility.',
      'Evaluate bottom zone for CTA placement and tap affordance.',
      'Choose text color from luminance contrast, add scrim if needed.',
      'Flag if image lacks usable text zones and needs regeneration.',
    ],
    placementHypothesis:
      objective === 'offer'
        ? 'Headline high and centered with strong CTA in bottom center.'
        : 'Headline in clean upper band with supporting line nearby and unobtrusive CTA below.',
    copyStrategy:
      objective === 'offer'
        ? 'Lead with specific value and urgency, avoid generic CTA wording.'
        : objective === 'launch'
          ? 'Lead with novelty and differentiation, then action.'
          : 'Lead with brand value and benefit, then low-friction action.',
  };
}

// Slim render prompt. The philosophy: pass the user's intent through with
// light framing, hand Gemini the aspect ratio and text safe zones, then
// trust it to compose. Heavy over-prompting was causing flat, literal,
// stock-style outputs — we removed the 40+ constraint waterfall.
function buildRenderPrompt(input: {
  rawPrompt: string;
  product: string;
  description: string;
  formatConfig: FormatConfig;
  colors?: string[];
  audience?: string;
  brand?: BrandProfile;
}): string {
  const { rawPrompt, product, description, formatConfig, colors, audience, brand } = input;
  void description;

  const userIntent = normalizeWhitespace(rawPrompt || description || product);
  const paletteClause =
    colors && colors.length > 0 ? `Palette accents: ${colors.join(', ')}.` : '';
  const audienceClause = audience ? `Audience: ${audience}.` : '';

  const brandClauses: string[] = [];
  if (brand) {
    brandClauses.push(`Brand: ${brand.name} (${brand.website}) — ${brand.summary}.`);
    brandClauses.push(
      `Palette: ${brand.primaryColor} and ${brand.secondaryColor} dominant.`
    );
    if (brand.id === 'partingword') {
      brandClauses.push(
        'Do not render tablets, phones, laptops, app icons, email glyphs, or UI overlays — use physical scenes with natural materials.'
      );
    }
  }

  return normalizeWhitespace(
    [
      `Premium Instagram ad image, ${formatConfig.aspectRatio} aspect ratio, ${formatConfig.width}x${formatConfig.height}.`,
      // Gemini 3 Pro Image has a tendency to letterbox/pillarbox when the
      // prompt reads as "cinematic." Explicit edge-to-edge guard blocks that.
      `Fill the entire ${formatConfig.aspectRatio} frame edge-to-edge with photographic content; absolutely no letterbox bars, pillarbox bars, matte borders, vignette frames, or solid color margins of any kind.`,
      `Subject: ${product}.`,
      `Brief from the user: "${userIntent}"`,
      audienceClause,
      ...brandClauses,
      paletteClause,
      // We intentionally do NOT reserve text safe zones anymore — forcing the
      // model to keep the top/bottom 20% empty was flattening compositions.
      // The editor handles overlay legibility with scrims/shapes/contrast.
      // Editable overlays are added in post, so the model should not bake
      // typography into the pixels.
      'Do not render text, typography, captions, subtitles, logos, or watermarks inside the image — leave all copy for the overlay layer.',
      'Use your creative judgment to compose something magazine-quality that serves the brief; avoid centered tabletop cliché unless clearly right for the idea.',
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function buildSystemPrompt(profile: StyleProfile, objective: Objective, brand?: BrandProfile): string {
  const brandTone = brand
    ? `Brand tone for ${brand.name}: empathetic, dignified, trustworthy. Keep narrative logic consistent — one scene, one clear subject.`
    : 'Keep narrative logic consistent — one scene, one clear subject.';

  return normalizeWhitespace(
    [
      'You are the creative director at a top-tier performance marketing agency producing platform-native paid social visuals.',
      `Objective: ${objective}. Style: ${profile.name} (${profile.visualTone}).`,
      brandTone,
      // Keep the image clean of typography so the editor can layer real,
      // editable copy on top. No forced quiet bands — the compositor can
      // handle contrast with scrims and shapes if the scene is busy.
      'No text, typography, logos, or watermarks inside the image. Compose freely: the overlay layer handles all copy.',
    ].join(' ')
  );
}

export function detectCategory(product: string, description: string): string {
  const text = `${product} ${description}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }
  return 'general';
}

export function getFormatConfig(format: string): FormatConfig {
  const formatMap: Record<string, string> = {
    '1:1': 'square',
    '4:5': 'portrait',
    '9:16': 'story',
  };
  const key = formatMap[format] || format;
  return FORMAT_CONFIGS[key] || FORMAT_CONFIGS.square;
}

export function generateTextSafeZoneInstructions(config: FormatConfig): string {
  const topPct = Math.round(config.safeZoneTop * 100);
  const bottomPct = Math.round(config.safeZoneBottom * 100);
  return `Keep the top ${topPct}% and bottom ${bottomPct}% visually clean for text overlays. Keep the hero subject in the middle zone and avoid busy textures in headline/CTA lanes.`;
}

export function generateEnhancedPrompt(
  product: string,
  description: string,
  vibe: string,
  format: string,
  colors?: string[],
): {
  prompt: string;
  category: string;
  formatConfig: FormatConfig;
  textSafeZoneInstructions: string;
} {
  void vibe;
  const brand = detectBrandProfile(description, description);
  const category = brand ? 'general' : detectCategory(product, description);
  const formatConfig = getFormatConfig(format);
  const textSafeZoneInstructions = generateTextSafeZoneInstructions(formatConfig);
  const mergedColors = withBrandPalette(colors, brand);

  return {
    prompt: buildRenderPrompt({
      rawPrompt: description,
      product,
      description,
      formatConfig,
      colors: mergedColors,
      brand,
    }),
    category,
    formatConfig,
    textSafeZoneInstructions,
  };
}

export function buildPromptPipeline(options: {
  rawPrompt: string;
  product: string;
  description: string;
  vibe: string;
  format: string;
  colors?: string[];
  offer?: string;
  objective?: Objective;
}): {
  category: string;
  objective: Objective;
  formatConfig: FormatConfig;
  textSafeZoneInstructions: string;
  promptPipeline: PromptPipeline;
  placementHints: PlacementPlanHints;
  agenticPlan: AgenticPlan;
  suggestedTemplateId: string;
} {
  const {
    rawPrompt,
    product,
    description,
    vibe,
    format,
    colors,
    offer,
    objective: preferredObjective,
  } = options;

  const brand = detectBrandProfile(rawPrompt, description);
  const category = brand ? 'general' : detectCategory(product, description);
  const objective = preferredObjective ?? detectObjective(description, offer);
  const formatConfig = getFormatConfig(format);
  const textSafeZoneInstructions = generateTextSafeZoneInstructions(formatConfig);
  const styleProfile = resolveStyleProfile(vibe, category, brand);
  const audience = inferAudience(description);
  const mergedColors = withBrandPalette(colors, brand);
  const qualityChecklist = buildQualityChecklist(formatConfig, objective, styleProfile, brand);
  // objectiveStrategy is resolved for future extensibility even if the slim
  // render prompt doesn't consume it directly.
  void resolveObjectiveStrategy(objective);

  const baseCreativeBrief = normalizeWhitespace([
    `Product: ${product}.`,
    `Goal: ${objective}.`,
    audience ? `Audience: ${audience}.` : '',
    `Category: ${category}.`,
    `Vibe: ${vibe}.`,
    offer ? `Offer: ${offer}.` : '',
    `Target format: ${formatConfig.aspectRatio} (${formatConfig.width}x${formatConfig.height}).`,
    `Visual style: ${styleProfile.name}.`,
    brand ? `Brand: ${brand.name} (${brand.website}).` : '',
  ].join(' '));

  const renderPrompt = buildRenderPrompt({
    rawPrompt,
    product,
    description,
    formatConfig,
    colors: mergedColors,
    audience,
    brand,
  });

  const systemPrompt = buildSystemPrompt(styleProfile, objective, brand);

  return {
    category,
    objective,
    formatConfig,
    textSafeZoneInstructions,
    promptPipeline: {
      rawPrompt,
      baseCreativeBrief,
      renderPrompt,
      systemPrompt,
      styleProfileId: styleProfile.id,
      styleProfileName: styleProfile.name,
      qualityChecklist,
    },
    placementHints: derivePlacementHints(objective, vibe, brand),
    agenticPlan: buildAgenticPlan(objective, category, styleProfile, brand),
    suggestedTemplateId: selectTemplateId(objective, category, vibe, brand),
  };
}

export function enhanceImagePrompt(options: {
  product: string;
  category: string;
  vibe: string;
  format: string;
  colors?: string[];
}): {
  prompt: string;
  category: string;
  formatConfig: FormatConfig;
  textSafeZoneInstructions: string;
  photographyDirections: string;
} {
  const { product, category, vibe, format, colors } = options;
  const categoryConfig = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS.general;
  const formatConfig = getFormatConfig(format);
  const textSafeZoneInstructions = generateTextSafeZoneInstructions(formatConfig);
  const result = generateEnhancedPrompt(product, product, vibe, format, colors);

  const photographyDirections = [
    `Style: ${categoryConfig.photographyStyle}`,
    `Lighting: ${categoryConfig.lightingStyle}`,
    `Background: ${categoryConfig.backgroundStyle}`,
    `Depth of field: ${categoryConfig.depthOfField}`,
  ].join('. ');

  return {
    prompt: result.prompt,
    category,
    formatConfig,
    textSafeZoneInstructions,
    photographyDirections,
  };
}
