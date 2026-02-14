import { Router } from 'express';
import { generateEnhancedPrompt, detectCategory, } from './promptEngine.js';
import { generateCopy, validateCopy } from './copyEngine.js';
import { generateLayout, } from './layoutEngine.js';
const VIBE_COLOR_MAP = {
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
const COLOR_NAME_MAP = {
    red: '#D32F2F', orange: '#FF6B00', yellow: '#FFD600', green: '#2E7D32',
    blue: '#1565C0', purple: '#7B1FA2', pink: '#E91E63', black: '#212121',
    white: '#FFFFFF', gold: '#C9A84C', silver: '#9E9E9E', teal: '#00897B',
};
export function parsePrompt(prompt) {
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
    const colors = [];
    for (const [name, hex] of Object.entries(COLOR_NAME_MAP)) {
        if (lower.includes(name))
            colors.push(hex);
    }
    // Extract product
    let product = prompt;
    if (offer)
        product = product.replace(new RegExp(offer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
    for (const v of vibeKeywords)
        product = product.replace(new RegExp(`\\b${v}\\b`, 'gi'), '');
    for (const c of Object.keys(COLOR_NAME_MAP))
        product = product.replace(new RegExp(`\\b${c}\\b`, 'gi'), '');
    product = product.replace(/\b(and|the|a|an|for|with|vibe|sale|discount)\b/gi, '');
    product = product.replace(/[,]+/g, ' ').replace(/\s+/g, ' ').trim();
    return { product: product || 'product', offer, vibe, colors, rawPrompt: prompt };
}
export function generateAdSpec(parsed, format, templateId) {
    const { product, offer, vibe, colors, rawPrompt } = parsed;
    // 1. Detect product category
    const category = detectCategory(product, rawPrompt);
    // 2. Generate enhanced image prompt
    const enhancedPrompt = generateEnhancedPrompt(product, rawPrompt, vibe, format ?? 'square', colors);
    // 3. Generate copy
    const copy = generateCopy({
        product,
        offer: offer || undefined,
        vibe,
        category,
    });
    const copyValidation = validateCopy(copy);
    if (!copyValidation.valid) {
        console.warn('Copy validation warnings:', copyValidation.errors);
    }
    // 4. Resolve colors
    const vibeColors = VIBE_COLOR_MAP[vibe] ?? VIBE_COLOR_MAP.energetic;
    const adColors = {
        primary: colors[0] ?? vibeColors.primary,
        secondary: colors[1] ?? vibeColors.secondary,
        accent: vibeColors.accent,
        text: '#FFFFFF',
        background: '#121212',
    };
    // 5. Generate layout
    const layout = generateLayout(format ?? 'square', copy.headline, copy.subhead, copy.cta, adColors.background, adColors.accent);
    adColors.text = layout.textColors.headline;
    // 6. Build AdSpec
    return {
        imagePrompt: enhancedPrompt.prompt,
        texts: {
            headline: copy.headline,
            subhead: copy.subhead,
            cta: copy.cta,
        },
        colors: adColors,
        templateId: templateId ?? 'default',
        category,
        layout,
        metadata: {
            headlineFormula: copy.formula,
            contrastRatios: layout.contrastRatios,
            formatConfig: enhancedPrompt.formatConfig,
        },
    };
}
export function createGenerateAdRouter() {
    const router = Router();
    router.post('/api/generate-ad', (req, res) => {
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
