/**
 * Copy Engine - Generates better ad copy using proven copywriting formulas
 *
 * Features:
 * - Headline formulas based on proven patterns (urgency, benefit-led, question, social proof, number)
 * - Context-aware formula selection
 * - Subhead that complements (not repeats) headline
 * - Action-specific CTA text
 * - Character limit enforcement (IG best practices)
 */
// Character limits (Instagram best practices)
export const CHAR_LIMITS = {
    headline: 30,
    subhead: 60,
    cta: 15,
};
// CTA templates by intent
const CTA_TEMPLATES = {
    purchase: ['Shop Now', 'Buy Now', 'Shop Sale', 'Order Now', 'Get It'],
    'sign-up': ['Sign Up', 'Join Free', 'Get Started', 'Join Now', 'Register'],
    download: ['Download', 'Get Free', 'Download Now', 'Install Now'],
    learn: ['Learn More', 'Discover', 'See More', 'Explore', 'Find Out'],
    visit: ['Visit Us', 'See Store', 'Find Us', 'Come In'],
    book: ['Book Now', 'Reserve', 'Schedule', 'Book Today'],
    default: ['Shop Now', 'Learn More', 'Get Started'],
};
// Category-specific intent preferences (maps to CTA_TEMPLATES keys)
const CATEGORY_INTENT_MAP = {
    food: 'purchase',
    fashion: 'purchase',
    tech: 'purchase',
    beauty: 'purchase',
    fitness: 'sign-up',
    travel: 'book',
    home: 'purchase',
    automotive: 'learn',
    jewelry: 'purchase',
};
/**
 * Truncate text to character limit, preserving word boundaries
 */
function truncateText(text, limit) {
    if (text.length <= limit)
        return text;
    const words = text.split(' ');
    let result = '';
    for (const word of words) {
        const test = result ? `${result} ${word}` : word;
        if (test.length > limit)
            break;
        result = test;
    }
    return result || text.substring(0, limit);
}
/**
 * Capitalize first letter of each word (title case)
 */
function titleCase(text) {
    return text.replace(/\b\w/g, c => c.toUpperCase());
}
/**
 * Clean and prepare product name for display
 */
function cleanProductName(product) {
    return titleCase(product.trim())
        .replace(/\s+/g, ' ')
        .split(' ')
        .slice(0, 3) // Max 3 words for product name
        .join(' ');
}
/**
 * Determine the best headline formula based on input
 */
function selectFormula(input) {
    const { offer, vibe, category } = input;
    // If there's an offer with urgency indicators
    if (offer) {
        const lowerOffer = offer.toLowerCase();
        if (lowerOffer.includes('last') || lowerOffer.includes('final') || lowerOffer.includes('ending')) {
            return 'urgency';
        }
        if (lowerOffer.includes('%') || lowerOffer.includes('$')) {
            return 'urgency';
        }
    }
    // Vibe-based selection
    const lowerVibe = vibe.toLowerCase();
    if (lowerVibe.includes('urgent') || lowerVibe.includes('limited')) {
        return 'urgency';
    }
    if (lowerVibe.includes('curious') || lowerVibe.includes('mystery')) {
        return 'curiosity';
    }
    if (lowerVibe.includes('premium') || lowerVibe.includes('luxury')) {
        return 'benefit';
    }
    // Category-based defaults
    const categoryFormulas = {
        food: 'benefit',
        fashion: 'announcement',
        tech: 'benefit',
        beauty: 'benefit',
        fitness: 'number',
        travel: 'question',
        home: 'benefit',
    };
    return categoryFormulas[category] ?? 'benefit';
}
/**
 * Generate urgency headline
 */
function generateUrgencyHeadline(product, offer) {
    const productShort = cleanProductName(product);
    if (offer) {
        // Try to fit offer in headline
        const offerText = offer.toUpperCase();
        const fullText = `${offerText} ${productShort}`;
        if (fullText.length <= CHAR_LIMITS.headline) {
            return fullText;
        }
        // Just the offer if product makes it too long
        return truncateText(offerText, CHAR_LIMITS.headline);
    }
    // Generic urgency without offer
    const templates = [
        'Last Chance',
        'Ending Soon',
        'Don\'t Miss Out',
        'Limited Time',
        'Act Fast',
    ];
    return templates[0];
}
/**
 * Generate benefit-led headline
 */
function generateBenefitHeadline(product, category) {
    const productShort = cleanProductName(product);
    const benefitTemplates = {
        food: ['Taste the Difference', 'Fresh & Delicious', 'Savor Every Bite'],
        fashion: ['Style Your Way', 'Look Amazing', 'Elevate Your Look'],
        tech: ['Upgrade Your Life', 'Next Level Tech', 'Smarter Living'],
        beauty: ['Glow Up Today', 'Radiant Beauty', 'Your Best Look'],
        fitness: ['Get Fit Fast', 'Transform Now', 'Stronger Today'],
        travel: ['Escape Awaits', 'Adventure Calls', 'Dream Getaway'],
        home: ['Love Your Space', 'Home Sweet Home', 'Upgrade Your Home'],
        general: ['Discover More', 'Experience Better', 'Transform Today'],
    };
    const templates = benefitTemplates[category] ?? benefitTemplates.general ?? ['Discover More'];
    return truncateText(templates[0], CHAR_LIMITS.headline);
}
/**
 * Generate question headline
 */
function generateQuestionHeadline(product, category) {
    const productShort = cleanProductName(product);
    const questionTemplates = {
        food: ['Hungry Yet?', 'Ready to Eat?', 'Craving Something?'],
        fashion: ['Ready to Shine?', 'New Look?', 'Style Upgrade?'],
        tech: ['Need an Upgrade?', 'Ready for More?', 'What\'s Next?'],
        beauty: ['Glow Ready?', 'Time to Shine?', 'Feel Beautiful?'],
        fitness: ['Ready to Transform?', 'Fitness Goals?', 'Up for It?'],
        travel: ['Where Next?', 'Ready to Go?', 'Dream Trip?'],
        home: ['Home Refresh?', 'Ready to Decorate?', 'New Space?'],
        general: ['Ready for More?', 'Why Wait?', 'What If?'],
    };
    const templates = questionTemplates[category] ?? questionTemplates.general ?? ['Ready?'];
    return truncateText(templates[0], CHAR_LIMITS.headline);
}
/**
 * Generate social proof headline
 */
function generateSocialProofHeadline(product, category) {
    const templates = [
        'Join 10K+ Fans',
        'Loved by Many',
        'Top Rated Choice',
        'Customer Favorite',
        'Best Seller',
    ];
    return truncateText(templates[0], CHAR_LIMITS.headline);
}
/**
 * Generate number headline
 */
function generateNumberHeadline(product, category) {
    const numberTemplates = {
        food: ['5 Star Flavor', '100% Fresh', '3 Ways to Enjoy'],
        fashion: ['3 New Looks', 'Top 5 Picks', '100+ Styles'],
        tech: ['5X Faster', '2X Power', '10+ Features'],
        beauty: ['5 min Glow', '3 Step Beauty', '24hr Results'],
        fitness: ['30 Day Fix', '5 Min Workout', '3X Results'],
        general: ['5 Reasons Why', 'Top 10 Pick', '#1 Choice'],
    };
    const templates = numberTemplates[category] ?? numberTemplates.general ?? ['Top Choice'];
    return truncateText(templates[0], CHAR_LIMITS.headline);
}
/**
 * Generate announcement headline
 */
function generateAnnouncementHeadline(product, offer) {
    const productShort = cleanProductName(product);
    if (offer) {
        return truncateText(`${productShort} Sale`, CHAR_LIMITS.headline);
    }
    return truncateText(`New ${productShort}`, CHAR_LIMITS.headline);
}
/**
 * Generate curiosity headline
 */
function generateCuriosityHeadline(product, category) {
    const templates = [
        'You Need This',
        'Game Changer',
        'Must Have Alert',
        'Wait Until You See',
        'The Secret\'s Out',
    ];
    return truncateText(templates[0], CHAR_LIMITS.headline);
}
/**
 * Generate subhead that complements the headline
 */
function generateSubhead(headline, product, offer, category, formula) {
    const productShort = cleanProductName(product);
    // Subhead templates by formula type
    const subheadTemplates = {
        urgency: [
            offer ? `Grab ${productShort} before it's gone` : `Limited time offer on ${productShort}`,
            `Don't miss this exclusive deal`,
            `Act now while supplies last`,
        ],
        benefit: [
            `Premium ${productShort} for every occasion`,
            `Experience the difference quality makes`,
            `Transform your routine with ${productShort}`,
        ],
        question: [
            `Discover what you've been missing`,
            `Your ${category === 'fitness' ? 'fitness' : category === 'beauty' ? 'beauty' : 'life'} journey starts here`,
            `Find your perfect ${productShort}`,
        ],
        'social-proof': [
            `See why thousands love ${productShort}`,
            `Join the community of happy customers`,
            `Rated excellent by real users`,
        ],
        number: [
            `Proven results you can count on`,
            `Discover the top reasons to switch`,
            `See why this is a customer favorite`,
        ],
        announcement: [
            `The latest arrival you've been waiting for`,
            `Fresh styles just dropped`,
            `Be the first to experience it`,
        ],
        curiosity: [
            `This is about to change everything`,
            `One look and you'll understand why`,
            `Discover what everyone's talking about`,
        ],
    };
    const templates = subheadTemplates[formula] ?? subheadTemplates.benefit;
    return truncateText(templates[0], CHAR_LIMITS.subhead);
}
/**
 * Generate CTA based on intent and category
 */
function generateCTA(intent, category, offer) {
    // If there's an offer, prefer purchase intent
    // Otherwise use provided intent, or category-based intent, or default
    const effectiveIntent = offer
        ? 'purchase'
        : (intent ?? CATEGORY_INTENT_MAP[category] ?? 'default');
    const options = CTA_TEMPLATES[effectiveIntent] ?? CTA_TEMPLATES.default;
    // Return first option that fits character limit
    for (const cta of options) {
        if (cta.length <= CHAR_LIMITS.cta) {
            return cta;
        }
    }
    return 'Shop Now'; // Safe fallback
}
/**
 * Main entry point for copy generation
 */
export function generateCopy(input) {
    const { product, offer, vibe, category, intent } = input;
    // Select the best formula
    const formula = selectFormula(input);
    // Generate headline based on formula
    let headline;
    switch (formula) {
        case 'urgency':
            headline = generateUrgencyHeadline(product, offer);
            break;
        case 'benefit':
            headline = generateBenefitHeadline(product, category);
            break;
        case 'question':
            headline = generateQuestionHeadline(product, category);
            break;
        case 'social-proof':
            headline = generateSocialProofHeadline(product, category);
            break;
        case 'number':
            headline = generateNumberHeadline(product, category);
            break;
        case 'announcement':
            headline = generateAnnouncementHeadline(product, offer);
            break;
        case 'curiosity':
            headline = generateCuriosityHeadline(product, category);
            break;
        default:
            headline = generateBenefitHeadline(product, category);
    }
    // Ensure headline fits character limit
    headline = truncateText(headline, CHAR_LIMITS.headline);
    // Generate complementary subhead
    const subhead = generateSubhead(headline, product, offer, category, formula);
    // Generate action-specific CTA
    const cta = generateCTA(intent, category, offer);
    return {
        headline,
        subhead,
        cta,
        formula,
    };
}
/**
 * Validate copy against character limits
 */
export function validateCopy(copy) {
    const errors = [];
    if (copy.headline.length > CHAR_LIMITS.headline) {
        errors.push(`Headline exceeds ${CHAR_LIMITS.headline} characters (got ${copy.headline.length})`);
    }
    if (copy.subhead.length > CHAR_LIMITS.subhead) {
        errors.push(`Subhead exceeds ${CHAR_LIMITS.subhead} characters (got ${copy.subhead.length})`);
    }
    if (copy.cta.length > CHAR_LIMITS.cta) {
        errors.push(`CTA exceeds ${CHAR_LIMITS.cta} characters (got ${copy.cta.length})`);
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
