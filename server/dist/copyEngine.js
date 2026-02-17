// Copy Engine - deterministic copy strategy with stronger CTA diversity.
export const CHAR_LIMITS = {
    headline: 34,
    subhead: 62,
    cta: 16,
};
function truncate(text, limit) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= limit)
        return normalized;
    const slice = normalized.slice(0, limit).trimEnd();
    const trimDangling = (value) => value.replace(/\b(and|or|with|for|to|of|in|on|at|the|a|an|your|our)\b$/i, '').trim();
    const lastSpace = slice.lastIndexOf(' ');
    if (lastSpace > Math.floor(limit * 0.55)) {
        const trimmed = trimDangling(slice.slice(0, lastSpace).trimEnd());
        return trimmed || slice.slice(0, lastSpace).trimEnd();
    }
    const trimmed = trimDangling(slice);
    return trimmed || slice;
}
function finalizeLine(text) {
    return text
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[,:;/-]+$/g, '')
        .trim();
}
function pickFittingOption(options, seed, limit) {
    if (options.length === 0)
        return undefined;
    const normalized = options
        .map((entry) => entry.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    if (normalized.length === 0)
        return undefined;
    const start = seed % normalized.length;
    for (let i = 0; i < normalized.length; i += 1) {
        const candidate = normalized[(start + i) % normalized.length];
        if (candidate.length <= limit)
            return candidate;
    }
    return undefined;
}
function normalizeDomain(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return undefined;
    let normalized = trimmed
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split(/[/?#]/)[0]
        .replace(/[),.;:!?]+$/, '')
        .toLowerCase();
    if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(normalized))
        return undefined;
    if (normalized.length < 4)
        return undefined;
    return normalized;
}
function extractDomainFromText(text) {
    const match = text.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?/i);
    if (!match)
        return undefined;
    return normalizeDomain(match[0]);
}
function titleCaseWords(text) {
    return text
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
        if (/^[A-Z0-9]+$/.test(word))
            return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
        .join(' ');
}
function deriveBrandFromDomain(domain) {
    if (!domain)
        return undefined;
    const root = domain.split('.')[0] ?? '';
    if (!root)
        return undefined;
    const phrase = root.replace(/[-_]+/g, ' ').trim();
    if (!phrase)
        return undefined;
    return titleCaseWords(phrase);
}
function extractBrandFromRawPrompt(rawPrompt) {
    if (!rawPrompt)
        return undefined;
    const camelMatch = rawPrompt.match(/\b[A-Z][a-z]+[A-Z][A-Za-z]*\b/);
    if (camelMatch?.[0])
        return camelMatch[0];
    const domainLabelMatch = rawPrompt.match(/\b([A-Za-z][A-Za-z0-9-]{2,})\.(com|io|co|ai|org|net)\b/);
    if (domainLabelMatch?.[1]) {
        return titleCaseWords(domainLabelMatch[1].replace(/[-_]+/g, ' '));
    }
    return undefined;
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function textHasToken(text, token) {
    if (!token)
        return false;
    return new RegExp(escapeRegExp(token), 'i').test(text);
}
function buildSubheadWithTail(subhead, tails, seed) {
    if (tails.length === 0)
        return undefined;
    const cleanSubhead = subhead.replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
    const start = seed % tails.length;
    for (let i = 0; i < tails.length; i += 1) {
        const tail = tails[(start + i) % tails.length];
        const candidate = `${cleanSubhead} ${tail}.`.replace(/\s+/g, ' ').trim();
        if (candidate.length <= CHAR_LIMITS.subhead) {
            return candidate;
        }
    }
    return undefined;
}
function maybeApplyBrandMention(copy, input, seed) {
    const domain = extractDomainFromText(input.rawPrompt ?? '');
    const brand = extractBrandFromRawPrompt(input.rawPrompt) ?? deriveBrandFromDomain(domain);
    if (!domain && !brand) {
        return {
            ...copy,
            brandMention: {
                mode: 'none',
                subtle: false,
            },
        };
    }
    const objective = objectiveFromInput(input);
    const subtleByVibe = ['calm', 'minimal', 'luxury', 'professional'].includes(input.vibe.toLowerCase());
    const subtle = subtleByVibe || isCompassionateContext(input);
    const ctaCandidates = [
        domain,
        domain?.replace(/\.(com|io|co|ai|org|net)$/i, ''),
        brand ? `Visit ${brand}` : undefined,
        brand ? `${brand} Site` : undefined,
        brand,
    ].filter((entry) => Boolean(entry));
    const ctaBrand = pickFittingOption(ctaCandidates, seed + 17, CHAR_LIMITS.cta);
    const allowDirectBrandCta = !subtle && (objective === 'offer' || objective === 'launch');
    if (allowDirectBrandCta && ctaBrand && !textHasToken(copy.cta, ctaBrand)) {
        return {
            ...copy,
            cta: ctaBrand,
            brandMention: {
                mode: 'cta',
                value: ctaBrand,
                subtle: false,
            },
        };
    }
    if (!subtle && objective === 'awareness' && brand) {
        const headlineCandidate = `${brand} ${copy.headline}`.replace(/\s+/g, ' ').trim();
        if (headlineCandidate.length <= CHAR_LIMITS.headline &&
            !textHasToken(copy.headline, brand)) {
            return {
                ...copy,
                headline: headlineCandidate,
                brandMention: {
                    mode: 'headline',
                    value: brand,
                    subtle: false,
                },
            };
        }
    }
    const tails = [
        domain ? `at ${domain}` : undefined,
        brand ? `with ${brand}` : undefined,
    ].filter((entry) => Boolean(entry));
    if (!textHasToken(copy.subhead, domain) &&
        !textHasToken(copy.subhead, brand)) {
        const subtleSubhead = buildSubheadWithTail(copy.subhead, tails, seed + 29);
        if (subtleSubhead) {
            return {
                ...copy,
                subhead: subtleSubhead,
                brandMention: {
                    mode: 'subhead',
                    value: domain ?? brand,
                    subtle: true,
                },
            };
        }
    }
    return {
        ...copy,
        brandMention: {
            mode: 'none',
            value: domain ?? brand,
            subtle,
        },
    };
}
function hasDiscount(offer) {
    if (!offer)
        return false;
    return /\d+%/.test(offer) || /\$\d+/.test(offer) || /\b(off|deal|save|sale)\b/i.test(offer);
}
function toTitleCase(text) {
    return text
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
function shortProduct(product) {
    const cleaned = product
        .replace(/\b(the|a|an|and|for|with|new|premium)\b/gi, ' ')
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned || 'Product';
}
function objectiveFromInput(input) {
    if (input.objective)
        return input.objective;
    return hasDiscount(input.offer) ? 'offer' : 'awareness';
}
function variantSalt(input) {
    return String(input.variantOffset ?? 0);
}
function isCompassionateContext(input) {
    const text = `${input.product} ${input.rawPrompt ?? ''}`.toLowerCase();
    return /partingword|end[\s-]?of[\s-]?life|legacy|farewell|last message|final message|bereavement|grief|after i'?m gone|loved ones/.test(text);
}
function detectCompassionTheme(input) {
    const text = `${input.product} ${input.rawPrompt ?? ''}`.toLowerCase();
    if (/\b(caregiver|care team|family coordinator|coordinator)\b/.test(text))
        return 'caregiver';
    if (/\b(parent|parents|younger family|kids|children)\b/.test(text))
        return 'parents';
    if (/\b(voice|audio|record|spoken)\b/.test(text))
        return 'voice';
    if (/\b(faith|blessing|values|spiritual|prayer)\b/.test(text))
        return 'faith';
    if (/\b(guidance|instructions|practical|care notes|documents)\b/.test(text))
        return 'practical';
    return 'core';
}
function planningSignalText(input) {
    const planning = input.planning;
    return [
        input.product,
        input.rawPrompt ?? '',
        planning?.targetAudience ?? '',
        planning?.narrativeMoment ?? '',
        planning?.copyStrategy ?? '',
        planning?.emotionalTone ?? '',
        ...(planning?.keyPhrases ?? []),
    ]
        .join(' ')
        .toLowerCase();
}
function deriveAudienceLabel(signalText) {
    if (/\b(caregiver|caregiver[s]?|coordinator|care team)\b/.test(signalText))
        return 'caregivers';
    if (/\b(children|kids|child)\b/.test(signalText))
        return 'children';
    if (/\b(parent|parents|family)\b/.test(signalText))
        return 'family';
    if (/\b(partner|spouse)\b/.test(signalText))
        return 'your partner';
    if (/\b(friend|friends)\b/.test(signalText))
        return 'friends';
    return 'loved ones';
}
function deriveFocusPhrase(signalText) {
    if (/\b(voice|audio|record|spoken)\b/.test(signalText))
        return 'voice notes';
    if (/\b(guidance|instruction|instructions|practical|care notes?)\b/.test(signalText))
        return 'guidance';
    if (/\b(values|faith|blessing|spiritual)\b/.test(signalText))
        return 'values';
    if (/\b(memory|memories)\b/.test(signalText))
        return 'memories';
    if (/\b(note|notes|letter|letters)\b/.test(signalText))
        return 'messages';
    return 'messages';
}
function deriveCompassionCtaCandidates(objective, ctaPriority = 'medium') {
    if (objective === 'offer') {
        return ctaPriority === 'high'
            ? ['Start Your Plan', 'Write First Note', 'Begin with Care', 'Plan Today']
            : ['Start a Message', 'Plan with Care', 'Begin Your Plan'];
    }
    if (objective === 'launch') {
        return ['See How It Works', 'Start a Message', 'Write First Note', 'Begin with Care'];
    }
    return ctaPriority === 'low'
        ? ['Learn the Process', 'Explore Flow', 'See the Steps']
        : ['Start a Message', 'See How It Works', 'Learn the Process'];
}
function hashSeed(parts) {
    const text = parts.join('|').toLowerCase();
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash;
}
function pickVariant(options, seed) {
    return options[seed % options.length];
}
function pickWithinLimit(options, seed, limit) {
    if (options.length === 0)
        return '';
    const normalized = options.map((entry) => entry.replace(/\s+/g, ' ').trim());
    const start = seed % normalized.length;
    for (let i = 0; i < normalized.length; i += 1) {
        const candidate = normalized[(start + i) % normalized.length];
        if (candidate.length <= limit) {
            return candidate;
        }
    }
    return truncate(normalized[start], limit);
}
function offerToken(offer) {
    if (!offer)
        return 'Limited Offer';
    const pct = offer.match(/\d+%\s*off/i);
    if (pct)
        return pct[0];
    const dollars = offer.match(/\$\d+\s*off/i);
    if (dollars)
        return dollars[0];
    if (/free shipping/i.test(offer))
        return 'Free Shipping';
    return offer.trim();
}
function formulaCandidates(input, objective) {
    // Intent-based formula selection takes priority
    if (input.intent === 'retargeting')
        return ['proof', 'benefit', 'question'];
    if (input.intent === 'conversion')
        return ['urgency', 'number', 'benefit'];
    if (input.intent === 'awareness')
        return ['benefit', 'curiosity', 'question'];
    const category = input.category.toLowerCase();
    const vibe = input.vibe.toLowerCase();
    if (objective === 'offer')
        return ['urgency', 'number', 'benefit'];
    if (objective === 'launch')
        return ['announcement', 'curiosity', 'question'];
    if (category === 'travel')
        return ['question', 'benefit', 'curiosity'];
    if (category === 'fitness')
        return ['number', 'benefit', 'proof'];
    if (category === 'tech')
        return ['benefit', 'proof', 'announcement'];
    if (vibe === 'luxury' || vibe === 'minimal')
        return ['announcement', 'curiosity', 'benefit'];
    return ['benefit', 'proof', 'curiosity'];
}
function selectFormula(input) {
    const objective = objectiveFromInput(input);
    const seed = hashSeed([
        input.product,
        input.offer ?? '',
        input.vibe,
        input.category,
        objective,
        variantSalt(input),
    ]);
    return pickVariant(formulaCandidates(input, objective), seed);
}
function generateHeadline(formula, input, seed) {
    const product = toTitleCase(shortProduct(input.product));
    const discount = offerToken(input.offer);
    switch (formula) {
        case 'urgency':
            return pickVariant([
                `Today Only: ${discount}`,
                `${discount} on ${product}`,
                `Last Call: ${discount}`,
                `Limited Drop: ${discount}`,
            ], seed);
        case 'benefit':
            return pickVariant([
                `${product}, Upgraded`,
                `Made for Better ${product}`,
                `Elevate Your ${product}`,
                `The Smarter ${product}`,
            ], seed);
        case 'question':
            return pickVariant([
                `Ready for Better ${product}?`,
                `Looking for Better ${product}?`,
                `What If ${product} Felt Effortless?`,
            ], seed);
        case 'announcement':
            return pickVariant([
                `Introducing ${product}`,
                `Meet the New ${product}`,
                `${product}, Reimagined`,
            ], seed);
        case 'number':
            return pickVariant([
                `3 Reasons to Switch`,
                `Why ${product} Wins`,
                `Built to Go Further`,
            ], seed);
        case 'curiosity':
            return pickVariant([
                `The ${product} Everyone Asks About`,
                `See What Makes It Different`,
                `Not Your Typical ${product}`,
            ], seed);
        case 'proof':
            return pickVariant([
                `Performance You Can Feel`,
                `Designed to Deliver Daily`,
                `Built for Real Results`,
            ], seed);
    }
}
function generateSubhead(formula, input, seed) {
    const product = shortProduct(input.product);
    const offer = offerToken(input.offer);
    const objective = objectiveFromInput(input);
    const objectiveLead = objective === 'offer'
        ? `Secure ${offer} before it ends.`
        : objective === 'launch'
            ? `Early access to our newest ${product}.`
            : `A better take on everyday ${product}.`;
    const formulaLines = {
        urgency: [
            `${objectiveLead} Limited inventory, no restocks promised.`,
            `${objectiveLead} Built for quick decisions and fast checkouts.`,
        ],
        benefit: [
            `Crafted for people who want ${product} to look and feel premium.`,
            `High-performance details, clean design, and zero visual noise.`,
        ],
        question: [
            `If ${product} should work harder for you, this is the one to try.`,
            `Designed to remove friction and raise the daily standard.`,
        ],
        announcement: [
            `Fresh release with refined materials, upgraded finish, and cleaner form.`,
            `A new chapter for ${product}, tuned for modern lifestyles.`,
        ],
        number: [
            `Built around practical wins: better feel, better durability, cleaner style.`,
            `Built for consistency, comfort, and repeat performance every day.`,
        ],
        curiosity: [
            `The details are subtle until you experience them firsthand.`,
            `Premium where it matters, simplified where it counts.`,
        ],
        proof: [
            `Trusted by customers who care about quality and consistency.`,
            `Engineered to perform without shouting for attention.`,
        ],
    };
    return pickVariant(formulaLines[formula], seed + 7);
}
export const RETARGETING_CTA_CANDIDATES = [
    'Come Back',
    'Still Interested?',
    'Complete Order',
    'Finish Checkout',
    'Return & Save',
];
function ctaCandidates(input, objective) {
    // Intent-based CTA selection
    if (input.intent === 'retargeting')
        return RETARGETING_CTA_CANDIDATES;
    if (input.intent === 'conversion')
        return ['Buy Now', 'Get Started', 'Claim Offer', 'Save Today'];
    if (input.intent === 'awareness')
        return ['Learn More', 'Discover More', 'See Why', 'Explore'];
    const category = input.category.toLowerCase();
    if (objective === 'offer') {
        if (category === 'travel')
            return ['Book the Deal', 'Claim This Fare', 'Reserve & Save'];
        if (category === 'food')
            return ['Order the Offer', 'Claim This Combo', 'Taste & Save'];
        if (category === 'tech')
            return ['Unlock Savings', 'Claim the Drop', 'Get the Deal'];
        return ['Claim Offer', 'Unlock Savings', 'Save Today', 'Get the Deal'];
    }
    if (objective === 'launch') {
        if (category === 'fashion' || category === 'jewelry')
            return ['See the Drop', 'View Collection', 'Explore Launch'];
        if (category === 'tech')
            return ['See Features', 'Explore Launch', 'Try It Now'];
        if (category === 'beauty')
            return ['Try the Formula', 'See the Launch', 'Discover the Drop'];
        return ['Explore Launch', 'Be First In', 'Discover It'];
    }
    if (category === 'travel')
        return ['Plan Your Escape', 'Start Planning', 'Explore Stays'];
    if (category === 'food')
        return ['See the Menu', 'Order Pickup', 'Try It Today'];
    if (category === 'fitness')
        return ['Start Training', 'Join the Program', 'Train Smarter'];
    if (category === 'tech')
        return ['See Features', 'Explore Specs', 'Try It Now'];
    if (category === 'home')
        return ['Refresh Your Space', 'See the Setup', 'View Details'];
    return ['Learn More', 'See Why', 'Explore More', 'View Details'];
}
function selectCta(input) {
    const objective = objectiveFromInput(input);
    const seed = hashSeed([
        input.product,
        input.offer ?? '',
        input.category,
        objective,
        'cta',
        variantSalt(input),
    ]);
    return pickVariant(ctaCandidates(input, objective), seed);
}
function compassionateCopy(input) {
    const objective = objectiveFromInput(input);
    const variant = Math.abs(input.variantOffset ?? 0);
    const planning = input.planning;
    const seed = hashSeed([
        input.product,
        input.rawPrompt ?? '',
        input.vibe,
        input.category,
        objective,
        'compassion',
    ]);
    const theme = detectCompassionTheme(input);
    const headlinesByTheme = {
        core: {
            offer: [
                'A Caring Way to Plan Ahead',
                'Messages That Hold What Matters',
                'Your Voice, Preserved With Care',
                'Leave Words That Last',
            ],
            launch: [
                'A Gentle Way to Leave Words',
                'Messages for the People You Love',
                'Your Voice, Preserved With Care',
                'Prepare Messages with Heart',
                'Leave Words That Last',
            ],
            awareness: [
                'Messages for the People You Love',
                'Plan Meaningful Messages Ahead',
                'When Words Matter Most',
                'Your Words Can Reach Later',
                'Keep Meaningful Notes Ready',
            ],
        },
        caregiver: {
            offer: ['Care Notes, Ready in Time', 'Guidance for Hard Moments', 'Clarity for Family Care'],
            launch: ['Support Notes for Loved Ones', 'Care Guidance, Preserved', 'Prepared Words for Family'],
            awareness: ['Give Family Clear Guidance', 'Care Instructions with Heart', 'Notes That Reduce Stress'],
        },
        parents: {
            offer: ['Plan Messages with Care', 'A Safer Way to Prepare', 'Future Notes for Your Family'],
            launch: ['Messages for Your Family', 'Prepared Words for Tomorrow', 'Write What Matters Most'],
            awareness: ['Peace of Mind for Families', 'Keep Your Voice with Family', 'Plan Ahead with Love'],
        },
        voice: {
            offer: ['Keep Your Voice Safe', 'Voice and Words, Protected', 'Preserve Your Voice Today'],
            launch: ['Your Voice, Ready Later', 'Record What Matters Most', 'Voice Messages with Care'],
            awareness: ['Keep Your Voice Alive', 'Voice Notes for Loved Ones', 'Your Words, Your Voice'],
        },
        faith: {
            offer: ['Preserve Values with Care', 'Blessings and Guidance Saved', 'Messages with Meaning'],
            launch: ['Faith and Family, Preserved', 'Words of Comfort, Kept', 'Values You Can Pass On'],
            awareness: ['Keep Blessings and Values', 'Messages Rooted in Love', 'Preserve What You Believe'],
        },
        practical: {
            offer: ['Practical Notes, Ready', 'Guidance That Reaches Family', 'Prepared Notes for Later'],
            launch: ['Organize Life Guidance', 'Clear Notes for Future Care', 'Practical Messages, Secured'],
            awareness: ['Practical Guidance with Heart', 'Future Instructions, Simplified', 'Clear Notes for Loved Ones'],
        },
    };
    const subheadsByTheme = {
        core: {
            offer: [
                'Create secure legacy messages with clarity, privacy, and compassion.',
                'Write meaningful notes now so loved ones can access them at the right time.',
                'A calm, trusted way to prepare words your family can hold onto.',
            ],
            launch: [
                'PartingWord helps you preserve guidance, memories, and love in one secure place.',
                'Prepare future messages with dignity so family has your words when needed.',
                'A trusted space for legacy messages, written with intention.',
            ],
            awareness: [
                'Write future messages your loved ones can receive at the right time.',
                'Turn meaningful thoughts into lasting messages your family can keep.',
                'A secure place for memories, guidance, and care notes.',
            ],
        },
        caregiver: {
            offer: [
                'Create practical care notes and personal guidance your family can act on quickly.',
                'Keep medical, daily, and emotional guidance in one trusted message plan.',
                'Give caregivers clear instructions with empathy and structure.',
            ],
            launch: [
                'Write care instructions and reassurance notes so family has clarity under pressure.',
                'Prepare practical guidance now to reduce stress in hard moments later.',
                'A secure way to leave family coordinators clear next steps.',
            ],
            awareness: [
                'Capture care guidance, key context, and loving words in one secure plan.',
                'Help family coordinators act with confidence using your prepared notes.',
                'Turn difficult future decisions into clearer family action.',
            ],
        },
        parents: {
            offer: [
                'Plan thoughtful future messages so your children always have your voice and guidance.',
                'Create secure notes for family milestones, reassurance, and practical support.',
                'A responsible way to prepare words your family can return to.',
            ],
            launch: [
                'Write messages for future birthdays, milestones, and life moments with care.',
                'Preserve your values and guidance so family can hear you later.',
                'A calm way for parents to plan meaningful legacy communication.',
            ],
            awareness: [
                'Keep your voice present in the moments your family may need it most.',
                'Prepare heartfelt and practical notes in a secure, trusted space.',
                'Plan ahead with love, clarity, and peace of mind.',
            ],
        },
        voice: {
            offer: [
                'Record and store voice notes with written guidance in one secure legacy vault.',
                'Preserve your tone, words, and meaning for loved ones to hear later.',
                'Keep voice and written messages together with private delivery controls.',
            ],
            launch: [
                'Capture voice memories and written notes so your loved ones keep your presence.',
                'A secure way to preserve both spoken and written legacy messages.',
                'Record what matters, then schedule when family receives it.',
            ],
            awareness: [
                'Save voice and written messages your loved ones can access in future moments.',
                'Keep your voice, context, and care together in one trusted place.',
                'Preserve more than text: preserve presence, tone, and meaning.',
            ],
        },
        faith: {
            offer: [
                'Preserve blessings, values, and family guidance in secure future messages.',
                'Write notes of comfort and conviction your loved ones can return to later.',
                'Keep meaningful words rooted in faith and care.',
            ],
            launch: [
                'Prepare messages that carry your values, reassurance, and love forward.',
                'Create secure legacy notes that reflect belief, dignity, and family care.',
                'A trusted space for preserving values and heartfelt guidance.',
            ],
            awareness: [
                'Store meaningful family messages shaped by faith, love, and practical care.',
                'Keep your values present through thoughtfully timed future notes.',
                'Give loved ones words of comfort they can hold onto.',
            ],
        },
        practical: {
            offer: [
                'Organize guidance, instructions, and key context in secure future messages.',
                'Create structured notes family can follow with confidence later.',
                'Prepare practical communication now so loved ones have clear direction.',
            ],
            launch: [
                'Write practical guidance and personal notes in one secure planning flow.',
                'A modern way to prepare important instructions without losing warmth.',
                'Keep key details and heartfelt context together for future delivery.',
            ],
            awareness: [
                'Build a clear set of future notes for family care, logistics, and reassurance.',
                'Turn complex future information into clear messages your family can use.',
                'Prepare practical legacy notes with clarity and compassion.',
            ],
        },
    };
    const ctasByTheme = {
        core: {
            offer: ['Start a Message', 'Plan with Care', 'Write a Message', 'Begin Your Plan'],
            launch: ['Write a Message', 'See the Process', 'Start with Care', 'Begin Your Plan'],
            awareness: ['Learn the Process', 'Start a Message', 'See How It Works', 'Explore the Flow'],
        },
        caregiver: {
            offer: ['Guide Loved Ones', 'Start Care Notes', 'Plan with Care'],
            launch: ['Write Care Notes', 'Set Family Notes', 'Start Care Plan'],
            awareness: ['Prepare Guidance', 'Start Care Notes', 'Guide Loved Ones'],
        },
        parents: {
            offer: ['Plan Family Notes', 'Write for Family', 'Start Your Plan'],
            launch: ['Start Family Notes', 'Write for Tomorrow', 'Plan with Care'],
            awareness: ['Plan with Care', 'Write for Family', 'Start Your Plan'],
        },
        voice: {
            offer: ['Record Voice', 'Save Voice Notes', 'Start Voice Plan'],
            launch: ['Record a Message', 'Save Voice Notes', 'Record Voice'],
            awareness: ['Keep Voice Notes', 'Record Voice', 'Save Your Voice'],
        },
        faith: {
            offer: ['Preserve Values', 'Write Blessings', 'Start a Message'],
            launch: ['Write Blessings', 'Preserve Values', 'Plan with Care'],
            awareness: ['Keep Values Safe', 'Write Blessings', 'Start a Message'],
        },
        practical: {
            offer: ['Set Deliveries', 'Create Care Notes', 'Start Your Plan'],
            launch: ['Prepare Notes', 'Set Deliveries', 'Plan with Care'],
            awareness: ['Prepare Notes', 'Set Deliveries', 'Create Care Notes'],
        },
    };
    const themeHeadlines = headlinesByTheme[theme][objective];
    const themeSubheads = subheadsByTheme[theme][objective];
    const themeCtas = ctasByTheme[theme][objective];
    const signalText = planningSignalText(input);
    const audienceLabel = deriveAudienceLabel(signalText);
    const focusPhrase = deriveFocusPhrase(signalText);
    const actionWord = /\b(record|voice)\b/.test(signalText) ? 'record' : 'write';
    const planningBrand = planning?.brandName?.trim();
    const dynamicHeadlines = [
        `Keep ${toTitleCase(focusPhrase)} Safe`,
        `Plan ${toTitleCase(focusPhrase)} Ahead`,
        `Words for ${toTitleCase(audienceLabel)}`,
        `${toTitleCase(focusPhrase)} with Care`,
        planningBrand ? `${planningBrand} with Care` : '',
    ]
        .map((line) => finalizeLine(line))
        .filter((line) => line.length > 0 && line.length <= CHAR_LIMITS.headline);
    const dynamicSubheads = [
        `A secure place to keep ${focusPhrase} for ${audienceLabel}.`,
        `${toTitleCase(actionWord)} now so ${audienceLabel} can receive your words later.`,
        `Preserve ${focusPhrase} and guidance in one trusted space.`,
        planning?.copyStrategy
            ? finalizeLine(planning.copyStrategy.replace(/^lead with\s+/i, ''))
            : '',
        planning?.narrativeMoment
            ? finalizeLine(`Built for ${planning.narrativeMoment.toLowerCase()}.`)
            : '',
    ]
        .map((line) => finalizeLine(line))
        .filter((line) => line.length > 0 && line.length <= CHAR_LIMITS.subhead);
    const dynamicCtas = deriveCompassionCtaCandidates(objective, planning?.ctaPriority);
    const identityByTheme = {
        core: [
            'PartingWord is a secure legacy messaging app.',
            'PartingWord stores future messages safely.',
        ],
        caregiver: [
            'PartingWord keeps care guidance organized.',
            'PartingWord stores practical caregiver notes.',
        ],
        parents: [
            'PartingWord helps parents leave future letters.',
            'PartingWord preserves messages for milestones.',
        ],
        voice: [
            'PartingWord keeps voice and written notes together.',
            'PartingWord preserves spoken legacy messages.',
        ],
        faith: [
            'PartingWord preserves values and blessings.',
            'PartingWord keeps faith-rooted messages.',
        ],
        practical: [
            'PartingWord organizes practical guidance securely.',
            'PartingWord stores clear family instructions.',
        ],
    };
    const valueByTheme = {
        core: ['Loved ones receive your words at the right time.', 'Your family can hold onto your voice with clarity.'],
        caregiver: ['Family coordinators get clear direction fast.', 'Caregivers can act with confidence in hard moments.'],
        parents: ['Children keep your voice for future milestones.', 'Family keeps guidance for moments that matter.'],
        voice: ['Loved ones keep your tone and presence.', 'Your voice stays present when family needs it most.'],
        faith: ['Family keeps words of comfort and conviction.', 'Loved ones receive reassurance rooted in your values.'],
        practical: ['Family gets clear steps, context, and care.', 'Future decisions become simpler and less stressful.'],
    };
    const bridgeByObjective = {
        offer: ['Start your plan today.', 'Begin with one message.'],
        launch: ['See how simple it is to start.', 'Create your first message in minutes.'],
        awareness: ['Explore how it works.', 'Start when you are ready.'],
    };
    const identity = pickVariant(identityByTheme[theme], seed + 9 + variant);
    const value = pickVariant(valueByTheme[theme], seed + 11 + variant);
    const bridge = pickVariant(bridgeByObjective[objective], seed + 13 + variant);
    const subhead = pickWithinLimit([
        ...dynamicSubheads,
        pickVariant(themeSubheads, seed + 3 + variant),
        identity,
        value,
        `${identity} ${bridge}`,
        `${value} ${bridge}`,
    ], seed + 3 + variant * 3, CHAR_LIMITS.subhead);
    const headline = pickWithinLimit([...dynamicHeadlines, ...themeHeadlines], seed + variant * 7, CHAR_LIMITS.headline);
    const cta = pickWithinLimit([...dynamicCtas, ...themeCtas], seed + 5 + variant * 7, CHAR_LIMITS.cta);
    return {
        headline: finalizeLine(headline),
        subhead: finalizeLine(subhead),
        cta: finalizeLine(cta),
        formula: 'benefit',
        planningDriven: Boolean(planning),
        planningRationale: planning
            ? [
                `Audience: ${planning.targetAudience || audienceLabel}`,
                `Focus: ${focusPhrase}`,
                `Strategy: ${planning.copyStrategy || 'compassionate clarity + low-friction action'}`,
            ]
            : undefined,
        brandMention: {
            mode: 'none',
            subtle: true,
        },
    };
}
export function generateCopy(input) {
    if (isCompassionateContext(input)) {
        const compassionate = compassionateCopy(input);
        const seed = hashSeed([
            input.product,
            input.rawPrompt ?? '',
            input.category,
            input.vibe,
            'brand-mention',
            variantSalt(input),
        ]);
        return maybeApplyBrandMention(compassionate, input, seed);
    }
    const objective = objectiveFromInput(input);
    const formula = selectFormula(input);
    const seed = hashSeed([
        input.product,
        input.offer ?? '',
        input.vibe,
        input.category,
        formula,
        variantSalt(input),
    ]);
    let headline = generateHeadline(formula, input, seed);
    if (objective === 'offer' &&
        input.offer &&
        !/\boff|deal|save|sale|offer\b/i.test(headline)) {
        headline = `${offerToken(input.offer)} ${headline}`;
    }
    headline = truncate(headline, CHAR_LIMITS.headline);
    const subhead = truncate(generateSubhead(formula, input, seed), CHAR_LIMITS.subhead);
    const planningCtas = input.planning?.ctaPriority === 'high'
        ? ['Get Started', 'Start Now', 'See Options']
        : input.planning?.ctaPriority === 'low'
            ? ['Learn More', 'See Details', 'Explore More']
            : [];
    const defaultCta = selectCta(input);
    const cta = truncate(pickWithinLimit([defaultCta, ...planningCtas], seed + 19, CHAR_LIMITS.cta), CHAR_LIMITS.cta);
    const baseCopy = {
        headline: finalizeLine(headline),
        subhead: finalizeLine(subhead),
        cta: finalizeLine(cta),
        formula,
        planningDriven: Boolean(input.planning),
        planningRationale: input.planning
            ? [
                `Audience: ${input.planning.targetAudience || 'broad paid-social audience'}`,
                `Strategy: ${input.planning.copyStrategy || 'objective-first conversion copy'}`,
            ]
            : undefined,
        brandMention: {
            mode: 'none',
            subtle: false,
        },
    };
    return maybeApplyBrandMention(baseCopy, input, seed);
}
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
