// Prompt Engine - Transform simple prompts into design-aware image prompts
export const FORMAT_CONFIGS = {
    square: {
        aspectRatio: '1:1',
        width: 1080,
        height: 1080,
        safeZoneTop: 0.20,
        safeZoneBottom: 0.25,
        composition: 'centered product placement with rule of thirds, balanced composition for square format',
    },
    portrait: {
        aspectRatio: '4:5',
        width: 1080,
        height: 1350,
        safeZoneTop: 0.20,
        safeZoneBottom: 0.25,
        composition: 'vertical emphasis with product in center third, breathing room at top and bottom for text overlays',
    },
    story: {
        aspectRatio: '9:16',
        width: 1080,
        height: 1920,
        safeZoneTop: 0.15,
        safeZoneBottom: 0.30,
        composition: 'full vertical layout with product in middle zone, generous negative space at top and bottom for text',
    },
};
export const CATEGORY_CONFIGS = {
    food: {
        photographyStyle: 'overhead food photography with appetizing presentation',
        lightingStyle: 'warm natural lighting with soft shadows',
        backgroundStyle: 'rustic wood or marble surface, lifestyle setting',
        colorPalette: 'warm tones - reds, oranges, golden yellows',
        depthOfField: 'shallow depth of field on hero ingredient',
    },
    fashion: {
        photographyStyle: 'editorial fashion photography with dynamic pose',
        lightingStyle: 'dramatic studio lighting with contrast',
        backgroundStyle: 'minimal studio or urban environment',
        colorPalette: 'high contrast with complementary colors',
        depthOfField: 'medium depth of field, sharp subject with soft background',
    },
    tech: {
        photographyStyle: 'minimal tech product photography on clean surface',
        lightingStyle: 'cool studio lighting with reflections',
        backgroundStyle: 'gradient or clean minimal background',
        colorPalette: 'cool tones - blues, silvers, whites',
        depthOfField: 'deep depth of field for product detail clarity',
    },
    beauty: {
        photographyStyle: 'luxury beauty product photography with artistic arrangement',
        lightingStyle: 'soft diffused lighting with gentle highlights',
        backgroundStyle: 'elegant pastel or marble surface',
        colorPalette: 'soft pinks, golds, and neutrals',
        depthOfField: 'shallow depth of field with bokeh',
    },
    fitness: {
        photographyStyle: 'dynamic fitness photography with energy and motion',
        lightingStyle: 'high-key energetic lighting',
        backgroundStyle: 'gym environment or outdoor active setting',
        colorPalette: 'bold energetic colors - neons, blacks, whites',
        depthOfField: 'medium depth of field capturing action',
    },
    travel: {
        photographyStyle: 'scenic travel photography with wanderlust appeal',
        lightingStyle: 'golden hour natural lighting',
        backgroundStyle: 'stunning destination landscape',
        colorPalette: 'natural earth tones and sky blues',
        depthOfField: 'deep depth of field for landscape detail',
    },
    home: {
        photographyStyle: 'interior lifestyle photography with cozy atmosphere',
        lightingStyle: 'warm ambient interior lighting',
        backgroundStyle: 'styled home interior setting',
        colorPalette: 'warm neutrals, earth tones',
        depthOfField: 'medium depth of field with room context',
    },
    automotive: {
        photographyStyle: 'automotive photography with dramatic angles',
        lightingStyle: 'dramatic directional lighting with reflections',
        backgroundStyle: 'open road or sleek studio',
        colorPalette: 'metallic tones, deep blacks, vibrant accents',
        depthOfField: 'deep depth of field showing full vehicle detail',
    },
    jewelry: {
        photographyStyle: 'macro jewelry photography with sparkle and detail',
        lightingStyle: 'precise spot lighting for sparkle and reflections',
        backgroundStyle: 'dark velvet or elegant neutral surface',
        colorPalette: 'rich darks with metallic highlights',
        depthOfField: 'very shallow depth of field highlighting gems and details',
    },
    general: {
        photographyStyle: 'professional commercial product photography',
        lightingStyle: 'balanced studio lighting',
        backgroundStyle: 'clean neutral background',
        colorPalette: 'versatile neutral palette',
        depthOfField: 'medium depth of field',
    },
};
const CATEGORY_KEYWORDS = {
    food: ['pizza', 'burger', 'coffee', 'sushi', 'cake', 'restaurant', 'meal', 'dish', 'recipe', 'cook', 'food', 'drink', 'tea', 'bread', 'salad', 'pasta'],
    fashion: ['dress', 'shirt', 'jacket', 'sneakers', 'shoes', 'jeans', 'clothing', 'outfit', 'wear', 'fashion', 'apparel', 'hoodie', 'coat', 'boots'],
    tech: ['laptop', 'phone', 'headphones', 'tablet', 'computer', 'gadget', 'app', 'software', 'smartphone', 'tech', 'device', 'camera', 'speaker', 'monitor'],
    beauty: ['lipstick', 'skincare', 'perfume', 'makeup', 'mascara', 'foundation', 'serum', 'moisturizer', 'beauty', 'cosmetic', 'lotion', 'cream'],
    fitness: ['workout', 'gym', 'protein', 'yoga', 'fitness', 'exercise', 'training', 'muscle', 'supplement', 'weights', 'running'],
    travel: ['travel', 'flight', 'hotel', 'vacation', 'trip', 'destination', 'resort', 'booking', 'tour', 'adventure'],
    home: ['furniture', 'decor', 'sofa', 'lamp', 'kitchen', 'bedroom', 'living room', 'home', 'interior', 'candle'],
    automotive: ['car', 'vehicle', 'auto', 'driving', 'motor', 'truck', 'suv', 'sedan', 'automotive'],
    jewelry: ['necklace', 'ring', 'bracelet', 'earring', 'jewelry', 'diamond', 'gold chain', 'pendant', 'watch'],
};
export function detectCategory(product, description) {
    const text = `${product} ${description}`.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => text.includes(kw))) {
            return category;
        }
    }
    return 'general';
}
export function getFormatConfig(format) {
    const formatMap = {
        '1:1': 'square',
        '4:5': 'portrait',
        '9:16': 'story',
    };
    const key = formatMap[format] || format;
    return FORMAT_CONFIGS[key] || FORMAT_CONFIGS.square;
}
export function generateTextSafeZoneInstructions(config) {
    const topPct = Math.round(config.safeZoneTop * 100);
    const bottomPct = Math.round(config.safeZoneBottom * 100);
    return `Keep the top ${topPct}% and bottom ${bottomPct}% of the image clean and uncluttered for text overlay placement. Avoid placing the main subject or busy elements in these zones. The product should be positioned in the middle zone to allow breathing room for headlines and CTAs.`;
}
export function generateEnhancedPrompt(product, description, vibe, format, colors) {
    const category = detectCategory(product, description);
    const formatConfig = getFormatConfig(format);
    const categoryConfig = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS.general;
    const textSafeZoneInstructions = generateTextSafeZoneInstructions(formatConfig);
    const parts = [
        `Professional quality commercial advertisement image.`,
        `${categoryConfig.photographyStyle}.`,
        `Product: ${product}. ${description}.`,
        `Mood/vibe: ${vibe}.`,
        `${categoryConfig.lightingStyle}.`,
        `Background: ${categoryConfig.backgroundStyle}.`,
        `Color palette: ${categoryConfig.colorPalette}.`,
        `Depth of field: ${categoryConfig.depthOfField}.`,
        `Composition: ${formatConfig.composition}.`,
        `Aspect ratio: ${formatConfig.aspectRatio}.`,
        textSafeZoneInstructions,
        `Rule of thirds product placement with visual hierarchy.`,
    ];
    if (colors && colors.length > 0) {
        parts.push(`Incorporate these brand colors: ${colors.join(', ')}.`);
    }
    return {
        prompt: parts.join(' '),
        category,
        formatConfig,
        textSafeZoneInstructions,
    };
}
export function enhanceImagePrompt(options) {
    const { product, category, vibe, format, colors } = options;
    const catConfig = CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS.general;
    const formatConfig = getFormatConfig(format);
    const textSafeZoneInstructions = generateTextSafeZoneInstructions(formatConfig);
    const photographyDirections = [
        `Style: ${catConfig.photographyStyle}`,
        `Lighting: ${catConfig.lightingStyle}`,
        `Background: ${catConfig.backgroundStyle}`,
        `Depth of field: ${catConfig.depthOfField}`,
    ].join('. ');
    const result = generateEnhancedPrompt(product, product, vibe, format, colors);
    return {
        prompt: result.prompt,
        category,
        formatConfig,
        textSafeZoneInstructions,
        photographyDirections,
    };
}
