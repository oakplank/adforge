/**
 * Prompt Engine - Transforms simple user prompts into design-aware, professional image prompts
 *
 * Applies:
 * - Ad format awareness (square, portrait, story)
 * - Design principles (rule of thirds, visual hierarchy, breathing room)
 * - Product category detection with category-specific photography styles
 * - Text-safe zones for overlay areas
 * - Professional photography direction (lighting, depth of field, background)
 */
export const FORMAT_CONFIGS = {
    square: {
        aspectRatio: '1:1',
        width: 1080,
        height: 1080,
        composition: 'centered balanced composition',
        safeZoneTop: 15,
        safeZoneBottom: 20,
        productPlacement: 'center or rule-of-thirds intersection',
    },
    portrait: {
        aspectRatio: '4:5',
        width: 1080,
        height: 1350,
        composition: 'vertical emphasis with product prominence',
        safeZoneTop: 12,
        safeZoneBottom: 22,
        productPlacement: 'center or lower-third for upward flow',
    },
    story: {
        aspectRatio: '9:16',
        width: 1080,
        height: 1920,
        composition: 'vertical narrative flow, eye-catching from top',
        safeZoneTop: 10,
        safeZoneBottom: 25,
        productPlacement: 'center-vertical, with space above for hook',
    },
};
export const CATEGORY_CONFIGS = {
    food: {
        keywords: ['food', 'restaurant', 'meal', 'drink', 'coffee', 'pizza', 'burger', 'sushi', 'dessert', 'cake', 'chocolate', 'snack', 'beverage', 'wine', 'beer', 'cocktail', 'smoothie', 'juice', 'tea', 'bakery', 'pastry', 'ice cream', 'salad', 'soup', 'sandwich', 'taco', 'pasta', 'steak', 'seafood'],
        photographyStyle: 'appetizing food photography, editorial food magazine quality',
        lightingStyle: 'soft natural window light, gentle shadows, appetizing warm tones',
        backgroundStyle: 'rustic wooden surface, marble countertop, or clean white with subtle texture',
        angle: 'overhead flat lay or 45-degree angle for depth',
        colorScheme: 'warm appetizing colors, golden hour tones',
        props: ['fresh ingredients', 'herbs', 'cutlery', 'napkins', 'plates'],
    },
    fashion: {
        keywords: ['fashion', 'clothing', 'apparel', 'dress', 'shirt', 'pants', 'shoes', 'sneakers', 'boots', 'jacket', 'coat', 'jeans', 'sweater', 'hoodie', 'accessories', 'bag', 'purse', 'wallet', 'belt', 'hat', 'cap', 'sunglasses', 'watch', 'jewelry', 'necklace', 'bracelet', 'ring', 'earrings'],
        photographyStyle: 'editorial fashion photography, high-end magazine aesthetic',
        lightingStyle: 'dramatic key light with soft fill, rim lighting for separation',
        backgroundStyle: 'seamless gradient, minimal studio backdrop, or editorial location',
        angle: 'eye-level or slightly low angle for presence',
        colorScheme: 'contrast-driven, brand-aligned colors',
        props: ['lifestyle elements', 'subtle reflections', 'fabric draping'],
    },
    tech: {
        keywords: ['tech', 'technology', 'gadget', 'phone', 'laptop', 'computer', 'tablet', 'headphones', 'earbuds', 'speaker', 'camera', 'drone', 'gaming', 'console', 'keyboard', 'mouse', 'monitor', 'tv', 'smart', 'watch', 'fitness tracker', 'charger', 'cable', 'case', 'app', 'software'],
        photographyStyle: 'clean product photography, Apple-style minimal aesthetic',
        lightingStyle: 'soft diffused lighting, subtle gradient reflections, highlight edges',
        backgroundStyle: 'solid gradient or subtle texture, minimal and clean',
        angle: 'product hero shot, slight angle to show depth',
        colorScheme: 'cool modern tones, white/black/silver with accent color',
        props: ['minimal shadows', 'gradient reflections', 'subtle lifestyle hints'],
    },
    beauty: {
        keywords: ['beauty', 'skincare', 'makeup', 'cosmetics', 'lipstick', 'mascara', 'foundation', 'serum', 'cream', 'lotion', 'moisturizer', 'perfume', 'fragrance', 'hair', 'shampoo', 'conditioner', 'styling', 'nail', 'polish', 'brush', 'sponge', 'mirror', 'spa'],
        photographyStyle: 'beauty editorial photography, clean and luxurious',
        lightingStyle: 'soft beauty lighting, even illumination, minimal harsh shadows',
        backgroundStyle: 'soft gradient, pastel tones, or clean white',
        angle: 'product focus with soft focus background, 45-degree or front-facing',
        colorScheme: 'soft pastels, rose gold, white, or brand colors',
        props: ['flowers', 'soft fabrics', 'water droplets', 'marble surfaces'],
    },
    fitness: {
        keywords: ['fitness', 'workout', 'gym', 'exercise', 'training', 'sports', 'athletic', 'running', 'yoga', 'weights', 'dumbbell', 'kettlebell', 'mat', 'resistance', 'protein', 'supplement', 'water bottle', 'activewear', 'leggings', 'sports bra', 'shorts', 'tank', 'shoes', 'sneakers'],
        photographyStyle: 'dynamic sports photography, energetic and motivational',
        lightingStyle: 'dramatic lighting with strong highlights, sweat glisten effect',
        backgroundStyle: 'gym environment, outdoor setting, or clean studio with dynamic feel',
        angle: 'low angle for power, action shots, or product hero',
        colorScheme: 'energetic bold colors, neon accents, or clean black/white',
        props: ['equipment', 'sweat effect', 'motion blur', 'energy trails'],
    },
    travel: {
        keywords: ['travel', 'vacation', 'holiday', 'trip', 'flight', 'hotel', 'resort', 'beach', 'mountain', 'adventure', 'tour', 'cruise', 'booking', 'destination', 'luggage', 'suitcase', 'backpack', 'passport', 'guide', 'experience', 'explore'],
        photographyStyle: 'destination photography, wanderlust-inducing travel imagery',
        lightingStyle: 'golden hour or blue hour, natural dramatic lighting',
        backgroundStyle: 'stunning landscapes, iconic landmarks, or luxury interiors',
        angle: 'wide establishing shot or intimate detail focus',
        colorScheme: 'vibrant destination colors, warm sunset or cool ocean tones',
        props: ['travel accessories', 'local elements', 'natural scenery'],
    },
    home: {
        keywords: ['home', 'furniture', 'decor', 'interior', 'bedding', 'pillow', 'blanket', 'lamp', 'lighting', 'rug', 'curtain', 'kitchen', 'bathroom', 'storage', 'organization', 'appliance', 'garden', 'outdoor', 'patio', 'tools', 'diy'],
        photographyStyle: 'interior design photography, lifestyle home aesthetic',
        lightingStyle: 'natural room lighting, soft ambient, warm and inviting',
        backgroundStyle: 'styled room setting, lifestyle context, or clean studio',
        angle: 'room view or product detail, lifestyle context',
        colorScheme: 'warm earth tones, neutrals, or on-trend palette',
        props: ['styled elements', 'plants', 'books', 'textures'],
    },
    automotive: {
        keywords: ['car', 'auto', 'vehicle', 'truck', 'suv', 'motorcycle', 'bike', 'electric', 'hybrid', 'luxury', 'sedan', 'sports car', 'lease', 'dealer', 'parts', 'tires', 'accessories', 'service', 'maintenance'],
        photographyStyle: 'automotive photography, showroom quality',
        lightingStyle: 'studio car lighting, dramatic reflections, highlight curves',
        backgroundStyle: 'gradient backdrop, scenic road, or showroom floor',
        angle: 'three-quarter front angle for dynamic presence',
        colorScheme: 'sleek metallic tones, dramatic contrast',
        props: ['reflection highlights', 'environmental hints'],
    },
    jewelry: {
        keywords: ['jewelry', 'ring', 'necklace', 'bracelet', 'earrings', 'pendant', 'diamond', 'gold', 'silver', 'platinum', 'gem', 'stone', 'pearl', 'watch', 'luxury', 'fine jewelry', 'engagement', 'wedding'],
        photographyStyle: 'luxury jewelry photography, macro detail focus',
        lightingStyle: 'sparkling light, multiple catchlights, dramatic sparkle',
        backgroundStyle: 'black velvet, white seamless, or elegant gradient',
        angle: 'macro detail or elegant product display',
        colorScheme: 'rich luxurious tones, gold, silver, precious stone colors',
        props: ['elegant display stands', 'soft fabric', 'flowers'],
    },
    general: {
        keywords: [],
        photographyStyle: 'professional commercial photography',
        lightingStyle: 'studio lighting, well-lit product presentation',
        backgroundStyle: 'clean gradient or minimal backdrop',
        angle: 'product hero shot',
        colorScheme: 'brand-appropriate colors',
        props: [],
    },
};
export const COLOR_PSYCHOLOGY = {
    food: {
        mood: 'appetizing, warm, inviting',
        primaryHues: ['warm orange', 'golden yellow', 'rich red', 'creamy white'],
        accentHues: ['fresh green', 'burgundy', 'chocolate brown'],
        avoidColors: ['blue', 'purple', 'grey'],
    },
    fashion: {
        mood: 'sophisticated, aspirational, trendy',
        primaryHues: ['black', 'white', 'navy', 'burgundy'],
        accentHues: ['gold', 'silver', 'bold accent'],
        avoidColors: ['neon combinations'],
    },
    tech: {
        mood: 'modern, innovative, sleek',
        primaryHues: ['white', 'black', 'silver', 'space grey'],
        accentHues: ['electric blue', 'subtle gradient'],
        avoidColors: ['warm earth tones', 'pastels'],
    },
    beauty: {
        mood: 'luxurious, clean, feminine',
        primaryHues: ['soft pink', 'rose gold', 'white', 'nude'],
        accentHues: ['gold', 'champagne', 'soft coral'],
        avoidColors: ['harsh primaries', 'dark heavy colors'],
    },
    fitness: {
        mood: 'energetic, powerful, motivating',
        primaryHues: ['black', 'electric blue', 'neon accent', 'bold red'],
        accentHues: ['white', 'silver', 'energy yellow'],
        avoidColors: ['muted pastels', 'faded tones'],
    },
    travel: {
        mood: 'adventurous, dreamy, escapist',
        primaryHues: ['ocean blue', 'sunset orange', 'forest green', 'sand'],
        accentHues: ['golden hour gold', 'turquoise'],
        avoidColors: ['industrial grey', 'harsh neons'],
    },
    home: {
        mood: 'cozy, inviting, stylish',
        primaryHues: ['warm white', 'soft grey', 'natural wood', 'sage green'],
        accentHues: ['terracotta', 'navy', 'mustard'],
        avoidColors: ['harsh primaries', 'neon'],
    },
    automotive: {
        mood: 'powerful, luxurious, dynamic',
        primaryHues: ['silver', 'black', 'deep blue', 'metallic'],
        accentHues: ['chrome', 'carbon fiber black'],
        avoidColors: ['pastels', 'muted earth tones'],
    },
    jewelry: {
        mood: 'luxurious, elegant, precious',
        primaryHues: ['gold', 'silver', 'white', 'black'],
        accentHues: ['diamond white', 'sapphire blue', 'ruby red'],
        avoidColors: ['clashing primaries', 'cheap-looking brights'],
    },
    general: {
        mood: 'professional, trustworthy',
        primaryHues: ['blue', 'white', 'grey'],
        accentHues: ['accent color'],
        avoidColors: [],
    },
};
/**
 * Detect product category from the product description and keywords
 */
export function detectCategory(product, rawPrompt) {
    const text = `${product} ${rawPrompt}`.toLowerCase();
    for (const [category, config] of Object.entries(CATEGORY_CONFIGS)) {
        if (category === 'general')
            continue;
        for (const keyword of config.keywords) {
            if (text.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }
    return 'general';
}
/**
 * Get format configuration
 */
export function getFormatConfig(format) {
    const normalized = format.toLowerCase().trim();
    if (normalized === 'story' || normalized === '9:16')
        return FORMAT_CONFIGS.story;
    if (normalized === 'portrait' || normalized === '4:5')
        return FORMAT_CONFIGS.portrait;
    return FORMAT_CONFIGS.square;
}
/**
 * Generate text-safe zone instructions for the image prompt
 */
export function generateTextSafeZoneInstructions(formatConfig) {
    const topPercent = formatConfig.safeZoneTop;
    const bottomPercent = formatConfig.safeZoneBottom;
    return `IMPORTANT: Leave the top ${topPercent}% of the image clean and uncluttered for headline text overlay. Leave the bottom ${bottomPercent}% of the image with a clean, uncluttered area suitable for CTA button and call-to-action text. The product and main visual elements should be positioned in the central zone to avoid text overlap.`;
}
/**
 * Generate rule of thirds placement instructions
 */
export function generatePlacementInstructions(format) {
    switch (format) {
        case 'square':
            return 'Position the hero product at one of the rule-of-thirds intersection points (upper-left, upper-right, lower-left, or lower-right) or centered, leaving breathing room around edges.';
        case 'portrait':
            return 'Position the hero product in the central zone, slightly lower than center to create upward visual flow, maintaining breathing room at top and bottom.';
        case 'story':
            return 'Position the hero product vertically centered or in the middle-third of the frame, with clear space above for a hook/headline and below for CTA.';
        default:
            return 'Position the hero product with proper visual hierarchy and breathing room.';
    }
}
/**
 * Generate professional photography direction
 */
export function generatePhotographyDirections(category, vibe, formatConfig) {
    const catConfig = CATEGORY_CONFIGS[category];
    const colorPsych = COLOR_PSYCHOLOGY[category];
    return [
        `Photography style: ${catConfig.photographyStyle}`,
        `Lighting: ${catConfig.lightingStyle}`,
        `Camera angle: ${catConfig.angle}`,
        `Background: ${catConfig.backgroundStyle}`,
        `Color treatment: ${colorPsych.mood} mood with ${colorPsych.primaryHues.slice(0, 2).join(' and ')} tones`,
        `Composition: ${formatConfig.composition}`,
        `Depth of field: shallow depth of field for product focus with soft background blur`,
        `Quality: ultra high resolution, professional commercial grade, magazine quality`,
    ].join('. ');
}
/**
 * Generate the enhanced image prompt
 */
export function enhanceImagePrompt(input) {
    const { product, category, vibe, format, offer, colors } = input;
    const formatConfig = getFormatConfig(format);
    const catConfig = CATEGORY_CONFIGS[category];
    const colorPsych = COLOR_PSYCHOLOGY[category];
    // Build the comprehensive prompt
    const promptParts = [];
    // 1. Opening: Professional photography style
    promptParts.push(`${catConfig.photographyStyle} of ${product}`);
    // 2. Composition and format
    promptParts.push(`${formatConfig.aspectRatio} aspect ratio, ${formatConfig.composition}`);
    // 3. Lighting
    promptParts.push(catConfig.lightingStyle);
    // 4. Camera angle and background
    promptParts.push(`Shot from ${catConfig.angle}`);
    promptParts.push(`${catConfig.backgroundStyle}`);
    // 5. Color psychology
    const colorInstructions = colors && colors.length > 0
        ? `Color palette featuring ${colors.join(' and ')}`
        : `${colorPsych.mood} color palette with ${colorPsych.primaryHues.slice(0, 2).join(' and ')} as primary tones`;
    promptParts.push(colorInstructions);
    // 6. Product placement with rule of thirds
    promptParts.push(generatePlacementInstructions(format));
    // 7. Depth of field and professional quality
    promptParts.push('Shallow depth of field with beautiful bokeh background');
    promptParts.push('Ultra high resolution, professional commercial photography quality');
    // 8. Text-safe zones (critical for ad overlays)
    promptParts.push(generateTextSafeZoneInstructions(formatConfig));
    // 9. Vibe/mood if specific
    if (vibe && vibe !== 'energetic') {
        promptParts.push(`Overall mood: ${vibe}`);
    }
    // 10. Props if applicable
    if (catConfig.props.length > 0) {
        promptParts.push(`Styling details: ${catConfig.props.slice(0, 2).join(', ')}`);
    }
    const fullPrompt = promptParts.join('. ');
    return {
        prompt: fullPrompt,
        category,
        formatConfig,
        textSafeZoneInstructions: generateTextSafeZoneInstructions(formatConfig),
        photographyDirections: generatePhotographyDirections(category, vibe, formatConfig),
    };
}
/**
 * Main entry point for prompt engine
 */
export function generateEnhancedPrompt(product, rawPrompt, vibe, format, colors) {
    // Detect category
    const category = detectCategory(product, rawPrompt);
    // Normalize format
    const adFormat = format === 'story' || format === '9:16'
        ? 'story'
        : format === 'portrait' || format === '4:5'
            ? 'portrait'
            : 'square';
    return enhanceImagePrompt({
        product,
        category,
        vibe,
        format: adFormat,
        colors,
    });
}
