// Ad Archetypes — the opinionated catalog.
//
// Each archetype is a self-contained creative brief covering both sides of
// the ad: how the image should look (sent to Gemini as system + render
// guidance) and how the overlay copy should read (headline/subhead/CTA
// length, voice, punctuation conventions). The user picks one up-front,
// and every downstream stage pulls from the same brief so the visual and
// the words belong to the same ad.
//
// Adding a new archetype: define the full ArchetypeDefinition below, add it
// to the registry, write a quick test that asserts its prompt contains the
// category-defining keywords. Prefer cleaving out a new archetype over
// muddying an existing one — we're trying to *prevent* generic "stock ad"
// output, which means each archetype needs a sharp point of view.

export type ArchetypeId =
  | 'general'
  | 'product-launch'
  | 'sale-offer'
  | 'luxury'
  | 'food-beverage'
  | 'beauty-skincare'
  | 'tech-saas'
  | 'fitness-athletic'
  | 'travel-hospitality'
  | 'editorial-cause';

export type HeadlineVoice =
  | 'declarative'
  | 'poetic'
  | 'urgent'
  | 'question'
  | 'editorial'
  | 'command'
  | 'benefit';

export type CtaVoice = 'action' | 'inviting' | 'minimal' | 'urgent' | 'reflective' | 'none';

export interface ArchetypeCopyGuidelines {
  // Max character counts — overlay text has physical limits. Luxury
  // archetypes want tight 24-char headlines; editorial tolerates 60+.
  headlineMaxChars: number;
  subheadMaxChars: number;
  ctaMaxChars: number;
  // Voice / register direction. The copy engine consults this to bias
  // which headline formulas it picks.
  headlineVoice: HeadlineVoice;
  ctaVoice: CtaVoice;
  // Some archetypes treat the subhead as optional (luxury, editorial
  // pull-quotes). If false, the copy engine may return an empty string.
  subheadRequired: boolean;
  // Allow quotes around the headline? Editorial/cause archetypes often do
  // ("We want to leave them something real" — first-person quote). Most
  // commercial archetypes don't.
  allowQuotes: boolean;
  // Title case vs sentence case vs caps. Most modern ads use sentence case
  // ("Run the city") — caps are reserved for offer/sale urgency.
  capitalization: 'sentence' | 'title' | 'upper';
  // Prose direction passed to a downstream LLM copywriter once we have
  // one. Also serves as a human-readable rationale in the UI.
  tone: string;
  // A one-liner font direction for the overlay. Not enforced yet, but
  // future work can consume this to pre-select a font stack when the user
  // inserts a headline chip.
  typographyVibe: string;
}

export interface ArchetypeImageDirection {
  // System-prompt block sent to Gemini. This is the "creative director
  // note" that frames everything else in the render prompt.
  systemPrompt: string;
  // Bullets woven into the render prompt as style rules.
  styleDirectives: string[];
  // Lighting / composition shorthand — included verbatim in the render.
  lightingHint: string;
  compositionHint: string;
  // Visual clichés to explicitly avoid. Gemini 3 Pro Image respects these.
  avoidList: string[];
  // A palette-biasing nudge. E.g. luxury = "muted neutrals and metallics";
  // fitness-athletic = "high-contrast, saturated accent against dark".
  paletteBias: string;
}

export interface ArchetypeDefaultPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface ArchetypeDefinition {
  id: ArchetypeId;
  label: string;
  description: string;
  image: ArchetypeImageDirection;
  copy: ArchetypeCopyGuidelines;
  defaultPalette: ArchetypeDefaultPalette;
  // Suggested template on the overlay side. Useful hint for
  // layoutEngine / CopySuggestions defaults.
  suggestedTemplateId: 'minimal' | 'bold-sale' | 'product-showcase';
  // Two to three example prompts the picker surfaces once the user
  // selects this archetype. Kept concrete and specific — the whole
  // point is to show *what a great prompt in this category looks like*,
  // so users don't fall back to "make me a cool ad."
  examplePrompts: string[];
}

// ---------- Definitions ----------

const GENERAL: ArchetypeDefinition = {
  id: 'general',
  label: 'General',
  description:
    'Balanced all-purpose brief. Use when no archetype fits — the prompt itself carries the direction.',
  image: {
    systemPrompt:
      'You are a creative director at a top-tier performance marketing agency. Produce a modern, platform-native paid social image for the brief below. One scene, one clear subject, quiet confidence over clutter.',
    styleDirectives: [
      'Modern photographic realism unless the brief explicitly asks otherwise.',
      'Single focal subject with supporting environment, not a still-life on white.',
    ],
    lightingHint: 'natural-feeling directional light that models form cleanly',
    compositionHint: 'off-center subject with breathing room; avoid flat symmetric centering',
    avoidList: ['stock-photo energy', 'cheap composite look', 'overly literal prop staging'],
    paletteBias: 'follow the user brief; if silent, lean warm neutral with one accent',
  },
  copy: {
    // Align with legacy CHAR_LIMITS in copyEngine so untargeted callers
    // (no picked archetype) keep behaving exactly as before.
    headlineMaxChars: 36,
    subheadMaxChars: 72,
    ctaMaxChars: 18,
    headlineVoice: 'declarative',
    ctaVoice: 'action',
    subheadRequired: true,
    allowQuotes: false,
    capitalization: 'sentence',
    tone: 'Confident, clear, concrete. Lead with the benefit, not the feature.',
    typographyVibe: 'modern grotesk like Space Grotesk or Inter, medium weight',
  },
  defaultPalette: {
    primary: '#101826',
    secondary: '#1B2433',
    accent: '#FF6A3D',
    text: '#F6F7F8',
    background: '#0C1118',
  },
  suggestedTemplateId: 'minimal',
  examplePrompts: [
    'Weekend flash sale 30% off running shoes for city commuters, kinetic energy, black and orange.',
    'New skincare serum for sensitive skin, clean minimal vibe, soft blue and white palette.',
    'PartingWord.com end-of-life messaging platform launch, compassionate modern aesthetic, dark green and cream.',
  ],
};

const PRODUCT_LAUNCH: ArchetypeDefinition = {
  id: 'product-launch',
  label: 'Product Launch',
  description:
    'A new-thing-drops announcement. Hero the product, keep the copy short and confident, lead with novelty.',
  image: {
    systemPrompt:
      'You are shooting a product launch cover for a modern consumer brand. One hero object, studio-clean staging, deliberate geometry. The image should feel like the first page of a premium product catalog — not a stock ad.',
    styleDirectives: [
      'Product is the hero; scale it generously inside the frame.',
      'Use considered negative space around the product so the launch feels important.',
      'Prefer soft natural surfaces (paper, linen, brushed metal) over glossy acrylic cliché.',
      'Shallow depth of field with the hero tack-sharp.',
    ],
    lightingHint: 'soft directional key light from camera-left with a gentle fill; crisp shadow edges',
    compositionHint: 'off-center product on a thirds intersection with one supporting prop',
    avoidList: ['floating product on white', 'exploded parts diagrams', 'lifestyle extras that fight the hero'],
    paletteBias: 'muted neutral background with one saturated brand accent',
  },
  copy: {
    headlineMaxChars: 32,
    subheadMaxChars: 70,
    ctaMaxChars: 18,
    headlineVoice: 'declarative',
    ctaVoice: 'inviting',
    subheadRequired: true,
    allowQuotes: false,
    capitalization: 'sentence',
    tone: 'Announce with quiet confidence. Name the product, hint at why it matters, stop talking.',
    typographyVibe: 'large display grotesk with tight tracking',
  },
  defaultPalette: {
    primary: '#111827',
    secondary: '#1F2937',
    accent: '#F97316',
    text: '#F9FAFB',
    background: '#0B0F19',
  },
  suggestedTemplateId: 'product-showcase',
  examplePrompts: [
    'Introducing Field Notes, a matte-ceramic coffee pour-over for home kitchens. Launch in warm neutrals.',
    'New noise-cancelling headphones with brushed titanium and leather — confident minimal launch shot.',
    'Meet Atlas, our first plant-based protein bar. Hero the bar on a linen surface with soft side light.',
  ],
};

const SALE_OFFER: ArchetypeDefinition = {
  id: 'sale-offer',
  label: 'Sale / Offer',
  description:
    'Urgency-led offer. High contrast, the number is the hero, the CTA commands action.',
  image: {
    systemPrompt:
      'You are shooting a retail-sale hero image. The image must feel energetic and commercial without being tacky. Real product in a real scene, saturated accent color, clear typographic real estate for a big offer callout.',
    styleDirectives: [
      'Give the product presence but leave strong graphic space for a large percentage or offer text.',
      'Use a high-contrast background that will read behind bold overlay type.',
      'Dynamic angle or slight motion cue over a frozen still life.',
    ],
    lightingHint: 'punchy directional light, short shadows, saturated color',
    compositionHint: 'diagonal composition or strong graphic block that divides the frame',
    avoidList: ['flat white catalog look', 'soft moody lighting', 'tiny product in huge empty frame'],
    paletteBias: 'one saturated brand color against a near-black or deeply saturated complement',
  },
  copy: {
    headlineMaxChars: 24,
    subheadMaxChars: 60,
    ctaMaxChars: 16,
    headlineVoice: 'urgent',
    ctaVoice: 'urgent',
    subheadRequired: true,
    allowQuotes: false,
    capitalization: 'upper',
    tone: 'Urgent and specific. Lead with the number. End with a verb.',
    typographyVibe: 'condensed heavy display, UPPERCASE headline, italic optional for urgency',
  },
  defaultPalette: {
    primary: '#DC2626',
    secondary: '#111111',
    accent: '#FACC15',
    text: '#FFFFFF',
    background: '#0A0A0A',
  },
  suggestedTemplateId: 'bold-sale',
  examplePrompts: [
    'Flash sale 40% off running shoes this weekend only, high contrast red and black with yellow accent.',
    'Buy one get one free on winter jackets, urgent energetic feel, punchy saturated color.',
    '$50 off premium wireless headphones — last call offer, diagonal composition, bold graphic block.',
  ],
};

const LUXURY: ArchetypeDefinition = {
  id: 'luxury',
  label: 'Luxury / Premium',
  description:
    'Editorial, minimal, expensive-feeling. Let the image breathe and the copy whisper.',
  image: {
    systemPrompt:
      'You are the art director of a high-end fashion or jewelry title. The image must feel like an editorial page, not an advertisement. Quiet, considered, expensive, with an unmistakable sense of craft. Restraint is a feature.',
    styleDirectives: [
      'Treat the subject like a still life in a gallery: poise, not action.',
      'Use material texture — linen, stone, velvet, brushed metal — to carry emotion.',
      'Long tonal range: deep shadows and delicate highlights, no flat mid-tones.',
      'Camera angle is square-on or a slight low-angle, never tilted for drama.',
    ],
    lightingHint: 'low, directional north-window light with soft falloff and rich shadow',
    compositionHint: 'generous margin; subject anchors one side; let the other side breathe',
    avoidList: ['glossy cliché', 'fake sparkles', 'gold-gradient text (we add text in overlay)', 'over-saturated color'],
    paletteBias: 'muted naturals — cream, bone, ink, graphite, brushed gold or silver',
  },
  copy: {
    headlineMaxChars: 24,
    subheadMaxChars: 60,
    ctaMaxChars: 16,
    headlineVoice: 'editorial',
    ctaVoice: 'minimal',
    subheadRequired: false,
    allowQuotes: false,
    capitalization: 'sentence',
    tone: 'Speak softly. One sharp observation, no selling words. The image earns the headline.',
    typographyVibe: 'display serif (Playfair, DM Serif) or fine-weight grotesk, airy tracking',
  },
  defaultPalette: {
    primary: '#1A1A1A',
    secondary: '#EDE7DD',
    accent: '#C9A84C',
    text: '#FFFFFF',
    background: '#0F0E0C',
  },
  suggestedTemplateId: 'minimal',
  examplePrompts: [
    'Hand-forged 18k gold band on brushed stone, low window light, editorial jewelry cover feel.',
    'Cashmere overcoat draped on a linen chair in a quiet room, muted neutrals, north-window light.',
    'Single crystal perfume bottle on marble with soft shadow, expensive and quiet, no extra props.',
  ],
};

const FOOD_BEVERAGE: ArchetypeDefinition = {
  id: 'food-beverage',
  label: 'Food & Beverage',
  description:
    'Appetite-appeal macro photography with warmth and texture. Short playful copy.',
  image: {
    systemPrompt:
      'You are shooting for a food magazine cover. The image must trigger appetite: visible texture, steam, condensation, crumb, crust, gloss. Warm, tactile, slightly imperfect — this is food someone just made, not stock.',
    styleDirectives: [
      'Macro-ish perspective with the food close to the lens; let some area go gently out of focus.',
      'Keep one human prop (hand reaching in, a linen napkin, wooden board) to add life.',
      'Avoid perfectly arranged plates; real plating has asymmetry.',
      'Include visible moisture, steam, crumb, or sauce drip — anything that signals "just made".',
    ],
    lightingHint: 'warm window light from the side with a soft rim on the food',
    compositionHint: 'overhead or low 3/4 angle; subject fills 60–70% of frame',
    avoidList: ['floating food on white', 'generic restaurant stock look', 'motion blur on the food itself'],
    paletteBias: 'warm earth tones — burnt orange, olive, walnut — with a creamy highlight',
  },
  copy: {
    headlineMaxChars: 28,
    subheadMaxChars: 60,
    ctaMaxChars: 18,
    headlineVoice: 'poetic',
    ctaVoice: 'inviting',
    subheadRequired: true,
    allowQuotes: false,
    capitalization: 'sentence',
    tone: 'Sensory and specific. Name the ingredient or the moment, not the marketing.',
    typographyVibe: 'warm humanist serif or soft grotesk; exclamation only for flash offers',
  },
  defaultPalette: {
    primary: '#7C2D12',
    secondary: '#F5DEB3',
    accent: '#F59E0B',
    text: '#FFF8EE',
    background: '#1A120B',
  },
  suggestedTemplateId: 'product-showcase',
  examplePrompts: [
    'Fresh sourdough loaf torn open, steam rising, linen napkin and wooden board, warm side light.',
    'Iced coffee with condensation on a terrazzo counter, a hand reaching in, summer morning light.',
    'Neapolitan pizza with leopard-spot crust and melting mozzarella, overhead view, just out of the oven.',
  ],
};

const BEAUTY_SKINCARE: ArchetypeDefinition = {
  id: 'beauty-skincare',
  label: 'Beauty & Skincare',
  description:
    'Dewy, soft, ingredient-forward. Quiet copy, almost-poetry, gentle palette.',
  image: {
    systemPrompt:
      'You are shooting for a prestige skincare brand. The image should feel clean, water-soft, and confidently modern — never clinical, never floral cliché. The product (or the ingredient) is the hero, and the atmosphere around it reads as "well-cared-for skin".',
    styleDirectives: [
      'Glass, water drops, silk, or matte ceramic surfaces to cue cleanliness.',
      'If a hand or face is in frame, the skin is the lighting subject — not the product.',
      'Shallow DOF with the hero ingredient or product glass in sharp focus.',
      'Neutral environment that flatters skin tones across the range.',
    ],
    lightingHint: 'high-key diffused daylight with a faint cool highlight and soft warm shadow',
    compositionHint: 'centered or slight off-center product, generous top breathing room',
    avoidList: ['cliché flower petals', 'ice crystal spray', 'text baked into bottle label', 'stock model smile'],
    paletteBias: 'soft blush, cream, pale celadon, bone white with a single muted accent',
  },
  copy: {
    headlineMaxChars: 32,
    subheadMaxChars: 72,
    ctaMaxChars: 18,
    headlineVoice: 'poetic',
    ctaVoice: 'inviting',
    subheadRequired: false,
    allowQuotes: false,
    capitalization: 'sentence',
    tone: 'Quiet, sensory, ingredient-led. Avoid superlatives. Let the skin imagery do the work.',
    typographyVibe: 'fine-weight display serif or airy grotesk with open tracking',
  },
  defaultPalette: {
    primary: '#4A3E39',
    secondary: '#F5EEE8',
    accent: '#E8B8B0',
    text: '#FFFFFF',
    background: '#EDE4DA',
  },
  suggestedTemplateId: 'minimal',
  examplePrompts: [
    'Hydrating serum for sensitive skin, clean glass dropper on pale celadon, water-soft atmosphere.',
    'Matte ceramic sunscreen stick on a travertine shelf, soft diffused daylight, blush and bone palette.',
    'Niacinamide toner bottle beside a single fresh fig, no florals, quiet cream-and-blush palette.',
  ],
};

const TECH_SAAS: ArchetypeDefinition = {
  id: 'tech-saas',
  label: 'Tech & SaaS',
  description:
    'Confident, geometric, benefit-first. Lean on shape and typography over gadget cliché.',
  image: {
    systemPrompt:
      'You are shooting the cover art for a modern software brand. Avoid screenshots, laptops, phones, or hands-on-keyboard. Instead, use abstract physical geometry (paper, glass, metal, color fields) that evokes the product idea — clarity, speed, trust, organization — without literal UI.',
    styleDirectives: [
      'Geometric clarity: clean lines, planes, modular forms.',
      'Use one unexpected physical material (paper, acrylic, cast plaster, fabric) as the metaphor.',
      'Crisp studio edge lighting; avoid soft lifestyle blur.',
      'Saturated accent color block against a deeper neutral.',
    ],
    lightingHint: 'sharp key with a single color-bounce fill; avoid warm golden-hour softness',
    compositionHint: 'strong rectilinear divisions of the frame; leave a graphic zone for overlay copy',
    avoidList: ['laptops', 'phones', 'hands typing', 'abstract neural network glows', 'generic data viz'],
    paletteBias: 'deep navy or charcoal with one electric accent (electric blue, chartreuse, coral)',
  },
  copy: {
    headlineMaxChars: 36,
    subheadMaxChars: 80,
    ctaMaxChars: 18,
    headlineVoice: 'benefit',
    ctaVoice: 'action',
    subheadRequired: true,
    allowQuotes: false,
    capitalization: 'sentence',
    tone: 'Specific and benefit-led. No jargon, no buzzwords. State the outcome.',
    typographyVibe: 'modern sans like Inter, Söhne, or Space Grotesk; medium weight headline',
  },
  defaultPalette: {
    primary: '#0F172A',
    secondary: '#1E293B',
    accent: '#38BDF8',
    text: '#F8FAFC',
    background: '#060A13',
  },
  suggestedTemplateId: 'product-showcase',
  examplePrompts: [
    'A productivity app that plans your day, shown as folded paper planes on a cast plaster desk, electric blue accent.',
    'Team collaboration tool as three acrylic panels interlocking on charcoal, precise studio edge light.',
    'Cloud infrastructure platform as a stack of brushed aluminum blocks, single chartreuse accent, graphic negative space.',
  ],
};

const FITNESS_ATHLETIC: ArchetypeDefinition = {
  id: 'fitness-athletic',
  label: 'Fitness / Athletic',
  description:
    'Kinetic, sweaty, high-contrast. Strong verbs, punchy copy, motion signals.',
  image: {
    systemPrompt:
      'You are shooting an athletic performance image. Capture a real athlete in real effort, not a posed model. Motion cues — sweat, fabric tension, breath, flexed muscle — are the subject. The environment is harsh and honest.',
    styleDirectives: [
      'Real body in real effort; tense, asymmetric posture.',
      'Sweat, breath, or motion blur on a secondary element (hair, fabric, rope) — body stays sharp.',
      'Harsh honest environment (asphalt, gravel, concrete gym) over manicured backgrounds.',
      'Low angle or tight medium shot that emphasizes power.',
    ],
    lightingHint: 'hard directional light, high contrast, deep shadow, cool overall cast',
    compositionHint: 'subject slightly compressed against frame edge, leaving directional movement space',
    avoidList: ['staged smile', 'matching pastel gym outfit', 'empty-gym Peloton stock', 'motion blur on the whole frame'],
    paletteBias: 'near-black base with one ignited accent (electric green, orange, red)',
  },
  copy: {
    headlineMaxChars: 24,
    subheadMaxChars: 60,
    ctaMaxChars: 14,
    headlineVoice: 'command',
    ctaVoice: 'urgent',
    subheadRequired: true,
    allowQuotes: false,
    capitalization: 'upper',
    tone: 'Verbs, imperatives, no filler. "Run the city." "Break it." "Train for ten more."',
    typographyVibe: 'heavy condensed display, italic optional, tight tracking',
  },
  defaultPalette: {
    primary: '#0A0A0A',
    secondary: '#1F1F1F',
    accent: '#22C55E',
    text: '#FAFAFA',
    background: '#050505',
  },
  suggestedTemplateId: 'bold-sale',
  examplePrompts: [
    'Trail runner mid-stride on wet asphalt before dawn, sweat visible, cold hard light, electric green accent.',
    'Weightlifter chalking hands in a concrete gym, asymmetric tense posture, hard side light.',
    'Boxing gloves resting on a heavy bag, torn wraps, single low light, near-black frame with red accent.',
  ],
};

const TRAVEL_HOSPITALITY: ArchetypeDefinition = {
  id: 'travel-hospitality',
  label: 'Travel / Hospitality',
  description:
    'Place-evocative, warm, aspirational escape. Short evocative copy, location-named.',
  image: {
    systemPrompt:
      'You are shooting the cover of a travel title or a boutique hotel campaign. Capture a specific place at a specific hour. The location is the subject — the human figure, if present, is small inside it and serves as scale.',
    styleDirectives: [
      'Named place feel — this should look like somewhere, not a generic beach.',
      'Human (if any) is small in the frame, mostly a silhouette or back-view, no face.',
      'Atmospheric — haze, rain, sun, steam, low light — depending on the mood.',
      'Architectural or natural detail carries the image over a wide general vista.',
    ],
    lightingHint: 'golden hour or soft overcast with specific place-appropriate color cast',
    compositionHint: 'wide landscape with a strong foreground anchor; leading lines into distance',
    avoidList: ['generic beach stock', 'HDR oversharpening', 'crowds in frame'],
    paletteBias: 'warm dusk colors — amber, terracotta, faded teal, indigo',
  },
  copy: {
    headlineMaxChars: 30,
    subheadMaxChars: 60,
    ctaMaxChars: 18,
    headlineVoice: 'poetic',
    ctaVoice: 'inviting',
    subheadRequired: true,
    allowQuotes: false,
    capitalization: 'sentence',
    tone: 'Evocative, place-specific, warm. Mention the location or the feeling of being there.',
    typographyVibe: 'refined serif or airy humanist sans with wide tracking',
  },
  defaultPalette: {
    primary: '#2C1810',
    secondary: '#E8D5B7',
    accent: '#D97706',
    text: '#FFF8F0',
    background: '#1C120A',
  },
  suggestedTemplateId: 'minimal',
  examplePrompts: [
    'Boutique hotel courtyard in Oaxaca at golden hour, a single figure in linen, warm terracotta palette.',
    'Sleeper train window over alpine fog at dawn, steam visible, muted teal and amber.',
    'Stone harbor in Puglia at dusk, fishing boat in the foreground, soft indigo sky with warm lamp glow.',
  ],
};

const EDITORIAL_CAUSE: ArchetypeDefinition = {
  id: 'editorial-cause',
  label: 'Editorial / Cause',
  description:
    'Portrait- or story-driven, respectful, longer empathetic copy. Quotes welcome.',
  image: {
    systemPrompt:
      'You are shooting for an editorial feature or a cause-led campaign. The subject is a person, a relationship, or a human moment — portrayed with dignity, not pity. The image must be specific, true-feeling, and unembellished.',
    styleDirectives: [
      'Portrait or intimate moment; eye contact or caught-in-thought, never posed smile.',
      'Real-world setting — the subject belongs in this space.',
      'Honest skin tones, no heavy retouching, no cinematic color grade.',
      'Single strong graphic zone (wall, window, shadow) where a quote-style headline can sit.',
    ],
    lightingHint: 'window light or overcast daylight; gentle contrast; flattering tone on skin',
    compositionHint: 'medium or tight portrait with intentional negative space to one side',
    avoidList: ['stock smile', 'hero pose', 'dramatic golden-hour grading', 'cliché cause-imagery tropes'],
    paletteBias: 'muted, respectful — deep navy, warm earth, parchment; avoid loud accents',
  },
  copy: {
    headlineMaxChars: 60,
    subheadMaxChars: 120,
    ctaMaxChars: 20,
    headlineVoice: 'editorial',
    ctaVoice: 'reflective',
    subheadRequired: true,
    allowQuotes: true,
    capitalization: 'sentence',
    tone: 'First-person voice, specific and human. A long headline can read as a pull-quote.',
    typographyVibe: 'editorial serif (Tiempos, Publico) or high-contrast display; quote marks allowed',
  },
  defaultPalette: {
    primary: '#1E293B',
    secondary: '#E7E2D6',
    accent: '#78716C',
    text: '#F5F5F4',
    background: '#0C1118',
  },
  suggestedTemplateId: 'minimal',
  examplePrompts: [
    'Scholarship fund for first-generation college students, portrait in a library, honest quiet tone.',
    'Mental health awareness campaign, woman by a kitchen window, real light, space for a pull-quote headline.',
    'Clean water nonprofit in rural Kenya, a grandmother and grandchild at a new pump, dignified midday light.',
  ],
};

// ---------- Registry ----------

export const AD_ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  general: GENERAL,
  'product-launch': PRODUCT_LAUNCH,
  'sale-offer': SALE_OFFER,
  luxury: LUXURY,
  'food-beverage': FOOD_BEVERAGE,
  'beauty-skincare': BEAUTY_SKINCARE,
  'tech-saas': TECH_SAAS,
  'fitness-athletic': FITNESS_ATHLETIC,
  'travel-hospitality': TRAVEL_HOSPITALITY,
  'editorial-cause': EDITORIAL_CAUSE,
};

// User-facing list (excluding general, which is the silent fallback).
export const ARCHETYPE_PICKER_ORDER: ArchetypeId[] = [
  'product-launch',
  'sale-offer',
  'luxury',
  'food-beverage',
  'beauty-skincare',
  'tech-saas',
  'fitness-athletic',
  'travel-hospitality',
  'editorial-cause',
];

export function getArchetype(id: string | undefined): ArchetypeDefinition {
  if (!id) return GENERAL;
  const candidate = AD_ARCHETYPES[id as ArchetypeId];
  return candidate ?? GENERAL;
}

// Public listing used by the /api/archetypes endpoint. Includes the
// per-archetype example prompts so the client picker can surface them
// as contextual quick-prompt chips.
export function listArchetypes(): Array<{
  id: ArchetypeId;
  label: string;
  description: string;
  examplePrompts: string[];
}> {
  return ARCHETYPE_PICKER_ORDER.map((id) => {
    const a = AD_ARCHETYPES[id];
    return {
      id: a.id,
      label: a.label,
      description: a.description,
      examplePrompts: a.examplePrompts,
    };
  });
}
