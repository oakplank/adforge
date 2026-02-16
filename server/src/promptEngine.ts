// Prompt Engine - transform user intent into strategy + model-ready prompts.

export type Objective = 'offer' | 'launch' | 'awareness';

export interface FormatConfig {
  aspectRatio: string;
  width: number;
  height: number;
  safeZoneTop: number;
  safeZoneBottom: number;
  composition: string;
}

export interface CategoryConfig {
  photographyStyle: string;
  lightingStyle: string;
  backgroundStyle: string;
  colorPalette: string;
  depthOfField: string;
}

export interface PromptPipeline {
  rawPrompt: string;
  baseCreativeBrief: string;
  renderPrompt: string;
  systemPrompt: string;
  styleProfileId: string;
  styleProfileName: string;
  qualityChecklist: string[];
  creativeInterpretation: {
    intent: string;
    visualPromise: string;
    sceneBrief: string;
    backgroundDirective: string;
    variationOptions: string[];
  };
  interpretiveLayer: {
    selectedDirection: string;
    cleanedIntent: string;
    ambiguityFlags: string[];
    refinedSceneInstruction: string;
    doNotInclude: string[];
  };
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

interface StyleProfile {
  id: string;
  name: string;
  visualTone: string;
  typographyMood: string;
  avoidSignals: string[];
}

interface BrandProfile {
  id: string;
  name: string;
  website: string;
  summary: string;
  primaryColor: string;
  secondaryColor: string;
  preferredAlignment: 'left' | 'center' | 'right';
  styleProfileOverride?: keyof typeof STYLE_PROFILES;
}

interface CreativeArchetype {
  label: string;
  creativeConcept: string;
  heroSubjectDefault: string;
  subjectTreatmentDefault: string;
  categoryInsight: string;
  emotionalTone: string;
  visualEnergy: 'low' | 'medium' | 'high' | 'very high';
}

interface ObjectiveStrategy {
  compositionStrategy: string;
  framingPriority: string;
  ctaPlacement: string;
}

interface FormatFraming {
  formatFramingRules: string;
  textLanes: string;
}

interface CreativeInterpretation {
  intent: string;
  visualPromise: string;
  sceneBrief: string;
  backgroundDirective: string;
  variationOptions: string[];
}

interface InterpretiveLayerOutput {
  selectedDirection: string;
  cleanedIntent: string;
  ambiguityFlags: string[];
  refinedSceneInstruction: string;
  doNotInclude: string[];
}

export const FORMAT_CONFIGS: Record<string, FormatConfig> = {
  square: {
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    safeZoneTop: 0.18,
    safeZoneBottom: 0.24,
    composition: 'hero subject in center-middle with generous top and bottom breathing room',
  },
  portrait: {
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    safeZoneTop: 0.18,
    safeZoneBottom: 0.25,
    composition: 'subject in central third with clean top-left or top-center space for headline',
  },
  story: {
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    safeZoneTop: 0.14,
    safeZoneBottom: 0.30,
    composition: 'vertical scene with anchored subject in mid-zone, clear lanes for headline and CTA',
  },
};

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  food: {
    photographyStyle: 'premium culinary photography with tactile textures and realistic detail',
    lightingStyle: 'soft directional natural lighting with appetizing highlights',
    backgroundStyle: 'styled kitchen or tabletop environment with subtle prop restraint',
    colorPalette: 'warm culinary tones balanced by neutrals',
    depthOfField: 'controlled shallow depth of field with the hero product tack-sharp',
  },
  fashion: {
    photographyStyle: 'editorial fashion photography with confident product framing',
    lightingStyle: 'high-contrast studio lighting with crisp edges and dimensional shadows',
    backgroundStyle: 'intentional set design, either minimal studio or selective urban texture',
    colorPalette: 'clean high-contrast palette with one accent color',
    depthOfField: 'medium depth of field preserving garment detail',
  },
  tech: {
    photographyStyle: 'premium consumer-tech product photography with precision reflections',
    lightingStyle: 'controlled cool studio lighting with polished highlights',
    backgroundStyle: 'minimal gradient or engineered surface with low visual noise',
    colorPalette: 'cool neutrals and metallic tones with restrained accent',
    depthOfField: 'deep depth of field for product edges, materials, and interfaces',
  },
  beauty: {
    photographyStyle: 'high-end beauty still life with tactile ingredient cues',
    lightingStyle: 'diffused glow lighting with specular accents',
    backgroundStyle: 'minimal luxe surface, softly tonal and clean',
    colorPalette: 'soft neutrals with premium warm accents',
    depthOfField: 'shallow depth of field with elegant falloff',
  },
  fitness: {
    photographyStyle: 'performance-focused commercial photography with kinetic framing',
    lightingStyle: 'energetic contrast lighting emphasizing movement and strength',
    backgroundStyle: 'athletic environment or minimal training backdrop',
    colorPalette: 'bold energetic tones grounded by dark neutrals',
    depthOfField: 'medium depth of field with clear subject separation',
  },
  travel: {
    photographyStyle: 'cinematic destination photography with aspirational scale',
    lightingStyle: 'golden-hour or dramatic natural light',
    backgroundStyle: 'authentic location context with clean horizon lines',
    colorPalette: 'natural sky, earth, and water tones with clean contrast',
    depthOfField: 'deep depth of field preserving scenic detail',
  },
  home: {
    photographyStyle: 'interior lifestyle photography with intentional staging',
    lightingStyle: 'warm ambient key light with natural fill',
    backgroundStyle: 'clean domestic environment with reduced clutter',
    colorPalette: 'earth neutrals and soft warm accents',
    depthOfField: 'medium depth of field keeping hero object and environment readable',
  },
  automotive: {
    photographyStyle: 'premium automotive campaign photography with dynamic perspective',
    lightingStyle: 'dramatic directional lighting and controlled reflections',
    backgroundStyle: 'roadside cinematic scene or high-end studio set',
    colorPalette: 'metallic darks with vivid accent highlights',
    depthOfField: 'deep depth of field for body lines and context',
  },
  jewelry: {
    photographyStyle: 'luxury macro jewelry photography focused on craftsmanship',
    lightingStyle: 'precise sparkle lighting with controlled highlights',
    backgroundStyle: 'elevated minimal surface, matte and non-distracting',
    colorPalette: 'deep neutrals with metallic brilliance',
    depthOfField: 'very shallow depth of field with precise focal point',
  },
  general: {
    photographyStyle: 'premium commercial product photography',
    lightingStyle: 'balanced key-fill-rim setup for clean dimensionality',
    backgroundStyle: 'minimal intentional backdrop with low clutter',
    colorPalette: 'clean neutral base with a disciplined accent',
    depthOfField: 'medium depth of field with clear subject emphasis',
  },
};

const STYLE_PROFILES: Record<string, StyleProfile> = {
  energetic: {
    id: 'kinetic-premium',
    name: 'Kinetic Premium',
    visualTone: 'dynamic, sharp, high contrast, modern editorial',
    typographyMood: 'bold sans serif hierarchy with strong CTA weight',
    avoidSignals: ['cheap discount badge clutter', 'busy collage layouts', 'clipart energy bursts'],
  },
  calm: {
    id: 'quiet-luxe',
    name: 'Quiet Luxe',
    visualTone: 'soft, elevated, refined, breathable composition',
    typographyMood: 'clean semi-bold headline with subtle supporting type',
    avoidSignals: ['over-saturated colors', 'harsh shadows', 'aggressive promo shapes'],
  },
  luxury: {
    id: 'editorial-luxe',
    name: 'Editorial Luxe',
    visualTone: 'rich textures, intentional highlights, premium restraint',
    typographyMood: 'high-contrast serif/sans pairing feel with disciplined spacing',
    avoidSignals: ['coupon-store visual language', 'all-caps shouting', 'cheap neon gradients'],
  },
  playful: {
    id: 'joyful-design',
    name: 'Joyful Design',
    visualTone: 'vibrant but controlled color, playful geometry, polished finish',
    typographyMood: 'friendly bold heading with clear readability',
    avoidSignals: ['chaotic stickers', 'random emoji motifs', 'low-end marketplace aesthetic'],
  },
  professional: {
    id: 'modern-brand',
    name: 'Modern Brand',
    visualTone: 'structured, trustworthy, minimal, premium corporate',
    typographyMood: 'clean geometric sans with left-aligned hierarchy',
    avoidSignals: ['flash-sale style typography', 'aggressive glow effects', 'banner clutter'],
  },
  bold: {
    id: 'impact-campaign',
    name: 'Impact Campaign',
    visualTone: 'dramatic focal point, directional light, high clarity',
    typographyMood: 'commanding headline with short direct support line',
    avoidSignals: ['noisy gradients', 'thin unreadable type', 'visual over-decoration'],
  },
  minimal: {
    id: 'museum-minimal',
    name: 'Museum Minimal',
    visualTone: 'negative space, texture restraint, precise framing',
    typographyMood: 'quiet modern sans with measured scale',
    avoidSignals: ['text crowding', 'sticker-like badges', 'pattern overload'],
  },
  warm: {
    id: 'artisan-warm',
    name: 'Artisan Warm',
    visualTone: 'tactile warmth, natural light, handcrafted confidence',
    typographyMood: 'approachable bold headline with soft supporting line',
    avoidSignals: ['sterile cold lighting', 'overly synthetic gradients', 'generic stock look'],
  },
  cool: {
    id: 'precision-cool',
    name: 'Precision Cool',
    visualTone: 'crisp, modern, technical polish',
    typographyMood: 'clean tech-forward type rhythm',
    avoidSignals: ['muddy color grading', 'warm/yellow cast', 'visual fuzziness'],
  },
  fresh: {
    id: 'clean-fresh',
    name: 'Clean Fresh',
    visualTone: 'bright, clean, naturally energetic',
    typographyMood: 'confident sans hierarchy with breathing room',
    avoidSignals: ['dark grim palette', 'muddy highlights', 'dense scene clutter'],
  },
};

const PARTINGWORD_BRAND: BrandProfile = {
  id: 'partingword',
  name: 'PartingWord',
  website: 'https://www.partingword.com/',
  summary: 'an end-of-life messaging platform focused on compassionate legacy communication',
  primaryColor: '#1E4D3A',
  secondaryColor: '#F1E9DA',
  preferredAlignment: 'right',
  styleProfileOverride: 'professional',
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['pizza', 'burger', 'coffee', 'sushi', 'cake', 'restaurant', 'meal', 'dish', 'recipe', 'cook', 'food', 'drink', 'tea', 'bread', 'salad', 'pasta'],
  fashion: ['dress', 'shirt', 'jacket', 'sneakers', 'shoes', 'jeans', 'clothing', 'outfit', 'wear', 'fashion', 'apparel', 'hoodie', 'coat', 'boots', 'bag'],
  tech: ['laptop', 'phone', 'headphones', 'tablet', 'computer', 'gadget', 'app', 'software', 'smartphone', 'tech', 'device', 'camera', 'speaker', 'monitor', 'keyboard'],
  beauty: ['lipstick', 'skincare', 'perfume', 'makeup', 'mascara', 'foundation', 'serum', 'moisturizer', 'beauty', 'cosmetic', 'lotion', 'cream', 'sunscreen'],
  fitness: ['workout', 'gym', 'protein', 'yoga', 'fitness', 'exercise', 'training', 'muscle', 'supplement', 'weights', 'running', 'cycle'],
  travel: ['travel', 'flight', 'hotel', 'vacation', 'trip', 'destination', 'resort', 'booking', 'tour', 'adventure', 'airline'],
  home: ['furniture', 'decor', 'sofa', 'lamp', 'kitchen', 'bedroom', 'living room', 'home', 'interior', 'candle', 'cookware'],
  automotive: ['car', 'vehicle', 'auto', 'driving', 'motor', 'truck', 'suv', 'sedan', 'automotive', 'ev'],
  jewelry: ['necklace', 'ring', 'bracelet', 'earring', 'jewelry', 'diamond', 'gold chain', 'pendant', 'watch'],
};

const CATEGORY_ARCHETYPES: Record<string, CreativeArchetype> = {
  food: {
    label: 'Food, Drink & Hospitality',
    creativeConcept: 'Sensory trigger through texture and warmth',
    heroSubjectDefault: 'the dish or drink in tactile detail',
    subjectTreatmentDefault: 'editorial hero angle with environmental context',
    categoryInsight: 'Food ads convert on texture and authenticity, not perfection.',
    emotionalTone: 'craving and comfort',
    visualEnergy: 'low',
  },
  fitness: {
    label: 'Fitness & Wellness',
    creativeConcept: 'Aspirational-but-attainable movement moment',
    heroSubjectDefault: 'person mid-effort with real form and focus',
    subjectTreatmentDefault: 'in-context action framing with natural effort',
    categoryInsight: 'Inspire capability; avoid intimidating or unrealistic body cues.',
    emotionalTone: 'aspiration and determination',
    visualEnergy: 'very high',
  },
  tech: {
    label: 'SaaS & Software Products',
    creativeConcept: 'Outcome-first visual metaphor with clean composition',
    heroSubjectDefault: 'conceptual scene or premium device context',
    subjectTreatmentDefault: 'isolated or minimal workspace environment',
    categoryInsight: 'Simplicity sells software; visual clutter lowers trust and CTR.',
    emotionalTone: 'clarity and control',
    visualEnergy: 'low',
  },
  home: {
    label: 'Real Estate & Property',
    creativeConcept: 'Aspirational lived-in space that feels attainable',
    heroSubjectDefault: 'the environment and lifestyle context',
    subjectTreatmentDefault: 'architectural-lifestyle blend with natural light',
    categoryInsight: 'Sell the feeling of life in the space, not just dimensions.',
    emotionalTone: 'belonging and aspiration',
    visualEnergy: 'low',
  },
  general: {
    label: 'Websites & Digital Services',
    creativeConcept: 'Lifestyle-in-context showing the outcome the service enables',
    heroSubjectDefault: 'person experiencing the service outcome',
    subjectTreatmentDefault: 'environmental lifestyle with natural behavior',
    categoryInsight: 'Service ads convert when viewers see themselves in the moment.',
    emotionalTone: 'trust and possibility',
    visualEnergy: 'medium',
  },
};

const OBJECTIVE_STRATEGIES: Record<'awareness' | 'conversion' | 'engagement' | 'brand_building', ObjectiveStrategy> = {
  awareness: {
    compositionStrategy: 'Wide environmental framing with generous negative space for copy lanes.',
    framingPriority: 'headline-first',
    ctaPlacement: 'bottom-right or bottom-center, low footprint',
  },
  conversion: {
    compositionStrategy: 'Tighter crop with one clean high-contrast CTA lane.',
    framingPriority: 'CTA-first',
    ctaPlacement: 'prominent bottom zone',
  },
  engagement: {
    compositionStrategy: 'Slight asymmetry and unconventional crop to stop the scroll.',
    framingPriority: 'attention-first',
    ctaPlacement: 'minimal embedded action line',
  },
  brand_building: {
    compositionStrategy: 'Cinematic mood-first composition with strong world-building.',
    framingPriority: 'mood-first',
    ctaPlacement: 'minimal or none',
  },
};

const FORMAT_FRAMING: Record<string, FormatFraming> = {
  square: {
    formatFramingRules: 'Center-weighted focal point with controlled top/bottom lanes.',
    textLanes: 'top headline, bottom action line',
  },
  portrait: {
    formatFramingRules: 'Vertical sandwich layout with clean top and bottom safe zones.',
    textLanes: 'top headline zone, bottom action zone, optional left subhead rail',
  },
  story: {
    formatFramingRules: 'Vertical depth layering with subject in middle third.',
    textLanes: 'top headline, mid side subhead, bottom action line',
  },
};

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function stableHash(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function pickByHash<T>(items: T[], seedText: string): T {
  return items[stableHash(seedText) % items.length];
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

function resolveColorTemperature(vibe: string): 'warm' | 'cool' | 'neutral' | 'mixed' {
  const tone = vibe.toLowerCase();
  if (['warm'].includes(tone)) return 'warm';
  if (['cool', 'tech', 'minimal'].includes(tone)) return 'cool';
  if (['bold', 'playful', 'energetic'].includes(tone)) return 'mixed';
  return 'neutral';
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

function deriveIntent(description: string, objective: Objective, brand?: BrandProfile): string {
  if (brand?.id === 'partingword') {
    return 'help people preserve meaningful words for loved ones with dignity and calm trust';
  }
  if (objective === 'offer') return 'communicate immediate value and action';
  if (objective === 'launch') return 'introduce what is new and why it matters';
  return 'build trust and memorability around the product outcome';
}

function countKeywordMatches(text: string, terms: string[]): number {
  return terms.reduce((sum, term) => (text.includes(term) ? sum + 1 : sum), 0);
}

function buildInterpretiveLayer(input: {
  rawPrompt: string;
  product: string;
  category: string;
  objective: Objective;
  brand?: BrandProfile;
  creativeInterpretation: CreativeInterpretation;
}): InterpretiveLayerOutput {
  const { rawPrompt, product, category, objective, brand, creativeInterpretation } = input;
  const text = normalizeWhitespace(rawPrompt.toLowerCase());

  const ambiguityFlags: string[] = [];
  const digitalTerms = ['app', 'ui', 'icon', 'screen', 'tablet', 'phone', 'laptop', 'email', 'inbox'];
  const physicalTerms = ['letter', 'journal', 'notebook', 'desk', 'pen', 'envelope', 'keepsake', 'box'];

  if (text.length < 42) ambiguityFlags.push('prompt_too_short');
  if (/\b(and|with|plus|also)\b/.test(text)) ambiguityFlags.push('multi_clause_prompt');
  if (countKeywordMatches(text, digitalTerms) > 0 && countKeywordMatches(text, physicalTerms) > 0) {
    ambiguityFlags.push('mixed_digital_physical_signals');
  }

  if (brand?.id === 'partingword') {
    const directionProfiles = [
      {
        id: 'letter_ritual',
        label: 'Letter Ritual',
        triggers: ['letter', 'envelope', 'handwritten', 'write', 'journal', 'words'],
        refined:
          'Show a single intimate letter-writing ritual in a real home setting: one hero object (journal or letter), one supporting pen, soft natural light, and clear emotional calm.',
      },
      {
        id: 'voice_legacy',
        label: 'Voice Legacy',
        triggers: ['voice', 'record', 'audio', 'message', 'spoken'],
        refined:
          'Show a single voice-memory capture moment: one hero recorder object on a personal surface, one companion note card, warm natural shadows, and quiet dignity.',
      },
      {
        id: 'keepsake_archive',
        label: 'Keepsake Archive',
        triggers: ['legacy', 'keepsake', 'memory', 'future', 'family', 'archive'],
        refined:
          'Show one keepsake preparation scene: one hero keepsake box with one partially visible note, tactile fabrics, dark green and cream-beige palette, and grounded realism.',
      },
      {
        id: 'family_reflection',
        label: 'Family Reflection',
        triggers: ['loved ones', 'family', 'children', 'partner', 'parents'],
        refined:
          'Show one family-reflection environment without staged smiles: one meaningful object in foreground, lived-in home texture, soft directional lighting, and respectful calm.',
      },
    ];

    const scored = directionProfiles.map((profile) => ({
      profile,
      score: countKeywordMatches(text, profile.triggers),
    }));
    scored.sort((a, b) => b.score - a.score);
    const picked = scored[0].score > 0 ? scored[0].profile : pickByHash(directionProfiles, rawPrompt);

    return {
      selectedDirection: picked.label,
      cleanedIntent: 'Communicate secure, compassionate legacy messaging through one coherent human-centered scene.',
      ambiguityFlags,
      refinedSceneInstruction: picked.refined,
      doNotInclude: [
        'floating app icons',
        'email glyphs',
        'tablet/phone/laptop hero devices',
        'mixed metaphor props from different scenes',
        'centered stock-style tabletop symmetry',
      ],
    };
  }

  const genericDirection =
    objective === 'offer'
      ? 'Single Outcome Offer Scene'
      : objective === 'launch'
        ? 'Single Debut Narrative Scene'
        : 'Single Trust-Building Lifestyle Scene';

  return {
    selectedDirection: genericDirection,
    cleanedIntent: `Present ${product} through one clear ${category} story with no conflicting motifs.`,
    ambiguityFlags,
    refinedSceneInstruction: `Build one coherent scene anchored to ${creativeInterpretation.sceneBrief}. Keep only props that strengthen the same narrative.`,
    doNotInclude: ['unrelated props', 'random iconography', 'competing symbolic metaphors'],
  };
}

function buildCreativeInterpretation(input: {
  rawPrompt: string;
  product: string;
  description: string;
  category: string;
  objective: Objective;
  brand?: BrandProfile;
}): CreativeInterpretation {
  const { rawPrompt, product, description, category, objective, brand } = input;
  const seed = `${rawPrompt}|${product}|${category}|${objective}`;
  const intent = deriveIntent(description, objective, brand);

  if (brand?.id === 'partingword') {
    const options = [
      'A warmly lit writing desk with one open journal as the hero and a fountain pen as support, lived-in textures, calm evening atmosphere',
      'An intimate home scene with one hand sealing one letter as the hero action, soft daylight, heirloom materials, quiet emotional gravity',
      'A bedside table with one voice-note recorder as the hero and a handwritten card as support, gentle shadows, understated legacy symbolism',
      'A family keepsake box as the hero on natural linen with one partially visible note as support, soft directional light, respectful minimalism',
    ];
    const primary = pickByHash(options, seed);
    const secondary = options.filter((item) => item !== primary).slice(0, 2);
    return {
      intent,
      visualPromise: 'Show care, continuity, and emotional safety without fear-based imagery.',
      sceneBrief: primary,
      backgroundDirective:
        'Background should feel real and human: natural materials, subtle depth, low-detail text lane, no sterile studio emptiness, no device screens or UI symbols.',
      variationOptions: [primary, ...secondary],
    };
  }

  const categoryScenes: Record<string, string[]> = {
    food: [
      'Candid kitchen counter action with steam and texture-rich ingredients',
      'Restaurant table moment with hand interaction and appetizing depth',
      'Editorial close-up of hero dish with real-world prep context',
    ],
    tech: [
      'Aspirational workspace with meaningful human interaction and subtle device context',
      'Conceptual outcome metaphor scene with clean geometric environment',
      'Focused desk vignette showing calm control and modern precision',
    ],
    fitness: [
      'Mid-rep training moment with real effort and environmental authenticity',
      'Post-workout calm moment showing progress and confidence',
      'Dynamic outdoor movement scene with directional light and depth',
    ],
    home: [
      'Lived-in interior morning scene with natural light patterns',
      'Curated room vignette showing routine and comfort',
      'Architectural lifestyle angle emphasizing atmosphere over symmetry',
    ],
    general: [
      'Lifestyle outcome moment with a person naturally using the service result',
      'Object-and-environment narrative scene that implies benefit without UI',
      'Human-centered candid scene with authentic details and clear focal subject',
    ],
  };

  const options = categoryScenes[category] || categoryScenes.general;
  const primary = pickByHash(options, seed);
  const secondary = options.filter((item) => item !== primary).slice(0, 2);

  return {
    intent,
    visualPromise: `Translate "${product}" into an outcome-focused visual, not a literal static product shot.`,
    sceneBrief: primary,
    backgroundDirective:
      'Background must support text readability and brand tone, with controlled texture and no random bokeh blobs in the text lane.',
    variationOptions: [primary, ...secondary],
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
    `Maintain premium look and avoid low-end marketplace aesthetic.`,
    `Keep top ${top}% and bottom ${bottom}% clear enough for overlay text.`,
    `Preserve a single dominant focal subject and avoid crowded scenes.`,
    `Ensure lighting creates separation between subject and background.`,
    `Objective focus: ${objective} message clarity without generic stock tropes.`,
    `Styling restraint: avoid ${profile.avoidSignals.join(', ')}.`,
  ];

  if (brand) {
    checklist.push(`Honor brand palette with ${brand.primaryColor} and ${brand.secondaryColor}.`);
    checklist.push(`Match brand tone for ${brand.name}: compassionate, trusted, and calm.`);
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
      `Enforce premium visual quality and no discount-store clutter.`,
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

function buildRenderPrompt(input: {
  product: string;
  description: string;
  vibe: string;
  category: string;
  categoryConfig: CategoryConfig;
  categoryArchetype: CreativeArchetype;
  objectiveStrategy: ObjectiveStrategy;
  formatFraming: FormatFraming;
  colorTemperature: 'warm' | 'cool' | 'neutral' | 'mixed';
  formatConfig: FormatConfig;
  textSafeZoneInstructions: string;
  colors?: string[];
  audience?: string;
  objective: Objective;
  styleProfile: StyleProfile;
  brand?: BrandProfile;
  creativeInterpretation: CreativeInterpretation;
  interpretiveLayer: InterpretiveLayerOutput;
}): string {
  const {
    product,
    description,
    vibe,
    category,
    categoryConfig,
    categoryArchetype,
    objectiveStrategy,
    formatFraming,
    colorTemperature,
    formatConfig,
    textSafeZoneInstructions,
    colors,
    audience,
    objective,
    styleProfile,
    brand,
    creativeInterpretation,
    interpretiveLayer,
  } = input;

  const paletteClause = colors && colors.length > 0
    ? `Brand palette accents: ${colors.join(', ')}.`
    : 'Color palette should be disciplined and premium with one accent.';

  const audienceClause = audience ? `Audience focus: ${audience}.` : '';

  const brandClause = brand
    ? `Brand: ${brand.name} (${brand.website}) - ${brand.summary}.`
    : '';
  const laneSide =
    brand?.preferredAlignment === 'right'
      ? 'right'
      : brand?.preferredAlignment === 'left'
        ? 'left'
        : 'right';
  const contrastLaneInstruction = `The ${laneSide} 45% of the frame must maintain consistent low-detail tonality for high-contrast text overlay. Avoid gradient shifts, bokeh orbs, and texture changes in this zone.`;
  const sceneCoherenceInstruction =
    brand?.id === 'partingword'
      ? 'Use one coherent narrative scene with one primary anchor object and supporting props from the same world. Do not mix app UI symbols with unrelated physical props.'
      : 'Use one coherent narrative scene and avoid unrelated prop mashups.';
  const partingWordNoUiInstruction =
    brand?.id === 'partingword'
      ? 'Do not render tablets, phones, laptops, floating app icons, email glyphs, or glowing UI overlays.'
      : '';

  return normalizeWhitespace([
    `Create a premium Instagram ad base image.`,
    brandClause,
    `Category: ${categoryArchetype.label} (${category}).`,
    `Creative concept: ${categoryArchetype.creativeConcept}.`,
    `Product focus: ${product}. Context: ${description}.`,
    `Interpretation intent: ${creativeInterpretation.intent}.`,
    `Visual promise: ${creativeInterpretation.visualPromise}.`,
    `Primary scene blueprint: ${creativeInterpretation.sceneBrief}.`,
    `Background directive: ${creativeInterpretation.backgroundDirective}.`,
    `Scene variation options: ${creativeInterpretation.variationOptions.join(' | ')}.`,
    `Interpretive direction selected: ${interpretiveLayer.selectedDirection}.`,
    `Intent resolution: ${interpretiveLayer.cleanedIntent}.`,
    `Ambiguity flags: ${interpretiveLayer.ambiguityFlags.length > 0 ? interpretiveLayer.ambiguityFlags.join(', ') : 'none'}.`,
    `Refined scene instruction: ${interpretiveLayer.refinedSceneInstruction}.`,
    `Do not include: ${interpretiveLayer.doNotInclude.join(', ')}.`,
    audienceClause,
    `Objective: ${objective}.`,
    `Subject: ${categoryArchetype.heroSubjectDefault}. Treatment: ${categoryArchetype.subjectTreatmentDefault}.`,
    `Mood: ${vibe}. Emotional tone: ${categoryArchetype.emotionalTone}. Visual energy: ${categoryArchetype.visualEnergy}.`,
    `Color temperature: ${colorTemperature}.`,
    `Visual direction: ${styleProfile.visualTone}. Typography reference: ${styleProfile.typographyMood}.`,
    `Photography style: ${categoryConfig.photographyStyle}.`,
    `Lighting: ${categoryConfig.lightingStyle}.`,
    `Background: ${categoryConfig.backgroundStyle}.`,
    `Color direction: ${categoryConfig.colorPalette}.`,
    paletteClause,
    `Depth of field: ${categoryConfig.depthOfField}.`,
    `Composition strategy: ${objectiveStrategy.compositionStrategy}.`,
    `Framing priority: ${objectiveStrategy.framingPriority}. CTA placement: ${objectiveStrategy.ctaPlacement}.`,
    `Aspect ratio ${formatConfig.aspectRatio}. Format framing: ${formatFraming.formatFramingRules}. Text lanes: ${formatFraming.textLanes}.`,
    `Use full-bleed edge-to-edge composition with no border, no frame, no letterbox bars, and no matte color bands.`,
    `Do not default to centered static tabletop framing; use purposeful asymmetry and environmental storytelling.`,
    sceneCoherenceInstruction,
    partingWordNoUiInstruction,
    `Avoid perfectly centered hero placement unless explicitly requested; bias subject to one third to preserve clean text lanes.`,
    contrastLaneInstruction,
    textSafeZoneInstructions,
    `Category insight: ${categoryArchetype.categoryInsight}.`,
    `Authenticity: visible natural material texture, non-posed realism, and believable lighting falloff.`,
    `Avoid visual clutter, stock-photo energy, cheap marketplace look, symmetrical-by-default framing, and unreadable backgrounds.`,
    `No text overlays, no logos, no watermarks, no UI elements.`,
    `Photorealistic, campaign-quality, professional location-or-studio photography.`,
  ].join(' '));
}

function buildSystemPrompt(profile: StyleProfile, objective: Objective, brand?: BrandProfile): string {
  const brandTone = brand
    ? `Brand tone: ${brand.name} should feel empathetic, dignified, and trustworthy. Use ${brand.primaryColor} and ${brand.secondaryColor} as dominant palette references.`
    : '';

  return normalizeWhitespace([
    `You are the creative director at a top-tier performance marketing agency producing platform-native paid social visuals.`,
    `Objective priority: ${objective}.`,
    `Style profile: ${profile.name} (${profile.visualTone}).`,
    brandTone,
    `First interpret user intent, then choose a background scene that communicates product outcome. Avoid repetitive static compositions.`,
    `Keep narrative logic consistent: one scene, one clear subject, no random symbolic collisions.`,
    `Hard constraints: no text, no logos, no watermark, no cheap ecommerce aesthetic, no generic stock-photo energy.`,
    `Keep negative space intentional so downstream layout can place headline, subhead, and CTA.`,
    `When uncertain, prefer authentic imperfection over decorative polish.`,
  ].join(' '));
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
  const brand = detectBrandProfile(description, description);
  const category = brand ? 'general' : detectCategory(product, description);
  const formatConfig = getFormatConfig(format);
  const categoryConfig = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS.general;
  const categoryArchetype = CATEGORY_ARCHETYPES[category] || CATEGORY_ARCHETYPES.general;
  const formatFraming = FORMAT_FRAMING[format] || FORMAT_FRAMING.square;
  const colorTemperature = resolveColorTemperature(vibe);
  const textSafeZoneInstructions = generateTextSafeZoneInstructions(formatConfig);
  const objective = detectObjective(description);
  const objectiveStrategy = resolveObjectiveStrategy(objective);
  const styleProfile = resolveStyleProfile(vibe, category, brand);
  const creativeInterpretation = buildCreativeInterpretation({
    rawPrompt: description,
    product,
    description,
    category,
    objective,
    brand,
  });
  const interpretiveLayer = buildInterpretiveLayer({
    rawPrompt: description,
    product,
    category,
    objective,
    brand,
    creativeInterpretation,
  });
  const mergedColors = withBrandPalette(colors, brand);

  return {
    prompt: buildRenderPrompt({
      product,
      description,
      vibe,
      category,
      categoryConfig,
      categoryArchetype,
      objectiveStrategy,
      formatFraming,
      colorTemperature,
      formatConfig,
      textSafeZoneInstructions,
      colors: mergedColors,
      objective,
      styleProfile,
      brand,
      creativeInterpretation,
      interpretiveLayer,
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
  const categoryConfig = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS.general;
  const categoryArchetype = CATEGORY_ARCHETYPES[category] || CATEGORY_ARCHETYPES.general;
  const objectiveStrategy = resolveObjectiveStrategy(objective);
  const formatFraming = FORMAT_FRAMING[format] || FORMAT_FRAMING.square;
  const colorTemperature = resolveColorTemperature(vibe);
  const styleProfile = resolveStyleProfile(vibe, category, brand);
  const audience = inferAudience(description);
  const mergedColors = withBrandPalette(colors, brand);
  const qualityChecklist = buildQualityChecklist(formatConfig, objective, styleProfile, brand);
  const creativeInterpretation = buildCreativeInterpretation({
    rawPrompt,
    product,
    description,
    category,
    objective,
    brand,
  });
  const interpretiveLayer = buildInterpretiveLayer({
    rawPrompt,
    product,
    category,
    objective,
    brand,
    creativeInterpretation,
  });

  const baseCreativeBrief = normalizeWhitespace([
    `Product: ${product}.`,
    `Goal: ${objective}.`,
    audience ? `Audience: ${audience}.` : '',
    `Category: ${category}.`,
    `Vibe: ${vibe}.`,
    offer ? `Offer: ${offer}.` : '',
    `Target format: ${formatConfig.aspectRatio} (${formatConfig.width}x${formatConfig.height}).`,
    `Visual style: ${styleProfile.name}.`,
    `Creative scene: ${creativeInterpretation.sceneBrief}.`,
    brand ? `Brand: ${brand.name} (${brand.website}).` : '',
  ].join(' '));

  const renderPrompt = buildRenderPrompt({
    product,
    description,
    vibe,
    category,
    categoryConfig,
    categoryArchetype,
    objectiveStrategy,
    formatFraming,
    colorTemperature,
    formatConfig,
    textSafeZoneInstructions,
    colors: mergedColors,
    audience,
    objective,
    styleProfile,
    brand,
    creativeInterpretation,
    interpretiveLayer,
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
      creativeInterpretation: {
        intent: creativeInterpretation.intent,
        visualPromise: creativeInterpretation.visualPromise,
        sceneBrief: creativeInterpretation.sceneBrief,
        backgroundDirective: creativeInterpretation.backgroundDirective,
        variationOptions: creativeInterpretation.variationOptions,
      },
      interpretiveLayer: {
        selectedDirection: interpretiveLayer.selectedDirection,
        cleanedIntent: interpretiveLayer.cleanedIntent,
        ambiguityFlags: interpretiveLayer.ambiguityFlags,
        refinedSceneInstruction: interpretiveLayer.refinedSceneInstruction,
        doNotInclude: interpretiveLayer.doNotInclude,
      },
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
