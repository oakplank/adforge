// Copy Engine - Ad copy generation with proven headline formulas
export const CHAR_LIMITS = {
    headline: 30,
    subhead: 60,
    cta: 15,
};
function truncate(text, limit) {
    if (text.length <= limit)
        return text;
    return text.slice(0, limit - 1).trimEnd() + '…';
}
function hasDiscount(offer) {
    if (!offer)
        return false;
    return /\d+%/.test(offer) || /\$\d+/.test(offer);
}
function selectFormula(input) {
    if (hasDiscount(input.offer))
        return 'urgency';
    const cat = input.category.toLowerCase();
    if (cat === 'fitness')
        return 'number';
    if (cat === 'travel')
        return 'question';
    if (cat === 'tech')
        return 'benefit';
    if (cat === 'beauty')
        return 'curiosity';
    const vibe = input.vibe.toLowerCase();
    if (vibe === 'luxury' || vibe === 'premium')
        return 'announcement';
    if (vibe === 'energetic')
        return 'benefit';
    return 'benefit';
}
function generateHeadline(formula, input) {
    const product = input.product;
    switch (formula) {
        case 'urgency': {
            const match = input.offer?.match(/(\d+%\s*off)/i);
            const discount = match ? match[1] : input.offer || 'Sale';
            return `Last Chance: ${discount}`;
        }
        case 'benefit':
            return `Transform Your ${capitalize(product)}`;
        case 'question':
            return `Ready for ${capitalize(product)}?`;
        case 'announcement':
            return `Introducing ${capitalize(product)}`;
        case 'number':
            return `5 Reasons to Try ${capitalize(product)}`;
        case 'curiosity':
            return `Discover ${capitalize(product)}`;
    }
}
function generateSubhead(formula, input) {
    const product = input.product;
    switch (formula) {
        case 'urgency':
            return `Don't miss out on ${product}. Limited time only.`;
        case 'benefit':
            return `Experience the difference with premium ${product}.`;
        case 'question':
            return `Your perfect ${product} awaits. Start today.`;
        case 'announcement':
            return `The new standard in ${product} is here.`;
        case 'number':
            return `See why everyone is talking about ${product}.`;
        case 'curiosity':
            return `The secret to amazing ${product} revealed.`;
    }
}
function selectCta(input) {
    if (hasDiscount(input.offer))
        return 'Shop Now';
    const cat = input.category.toLowerCase();
    switch (cat) {
        case 'travel': return 'Book Now';
        case 'food': return 'Order Now';
        case 'tech': return 'Get Started';
        case 'fitness': return 'Start Now';
        default: return 'Shop Now';
    }
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
export function generateCopy(input) {
    const formula = selectFormula(input);
    const headline = truncate(generateHeadline(formula, input), CHAR_LIMITS.headline);
    const subhead = truncate(generateSubhead(formula, input), CHAR_LIMITS.subhead);
    const cta = truncate(selectCta(input), CHAR_LIMITS.cta);
    return { headline, subhead, cta, formula };
}
// Alias for story acceptance criteria
export const generateAdCopy = generateCopy;
export function validateCopy(copy) {
    const errors = [];
    if (copy.headline.length > CHAR_LIMITS.headline) {
        errors.push(`Headline exceeds ${CHAR_LIMITS.headline} characters (${copy.headline.length})`);
    }
    if (copy.subhead.length > CHAR_LIMITS.subhead) {
        errors.push(`Subhead exceeds ${CHAR_LIMITS.subhead} characters (${copy.subhead.length})`);
    }
    if (copy.cta.length > CHAR_LIMITS.cta) {
        errors.push(`CTA exceeds ${CHAR_LIMITS.cta} characters (${copy.cta.length})`);
    }
    return { valid: errors.length === 0, errors };
}
