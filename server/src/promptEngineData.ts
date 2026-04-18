// Prompt engine static data: format/category presets, style profiles, brand
// profiles, keyword maps, creative archetypes, objective strategies, and
// format framing rules. Pure data — no logic. Edit this file when tuning
// presets; the engine in promptEngine.ts consumes it.

export interface FormatConfig {
  aspectRatio: string;
  width: number;
  height: number;
  safeZoneTop: number;
  safeZoneBottom: number;
  composition: string;
}

interface CategoryConfig {
  photographyStyle: string;
  lightingStyle: string;
  backgroundStyle: string;
  colorPalette: string;
  depthOfField: string;
}

export interface StyleProfile {
  id: string;
  name: string;
  visualTone: string;
  typographyMood: string;
  avoidSignals: string[];
}

export interface BrandProfile {
  id: string;
  name: string;
  website: string;
  summary: string;
  primaryColor: string;
  secondaryColor: string;
  preferredAlignment: 'left' | 'center' | 'right';
  styleProfileOverride?: keyof typeof STYLE_PROFILES;
}

export interface ObjectiveStrategy {
  compositionStrategy: string;
  framingPriority: string;
  ctaPlacement: string;
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

export const STYLE_PROFILES: Record<string, StyleProfile> = {
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

export const PARTINGWORD_BRAND: BrandProfile = {
  id: 'partingword',
  name: 'PartingWord',
  website: 'https://www.partingword.com/',
  summary: 'an end-of-life messaging platform focused on compassionate legacy communication',
  primaryColor: '#1E4D3A',
  secondaryColor: '#F1E9DA',
  preferredAlignment: 'right',
  styleProfileOverride: 'professional',
};

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
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

export const OBJECTIVE_STRATEGIES: Record<'awareness' | 'conversion' | 'engagement' | 'brand_building', ObjectiveStrategy> = {
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

