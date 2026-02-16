// Copy Engine - deterministic copy strategy with stronger CTA diversity.

export type HeadlineFormula =
  | 'urgency'
  | 'benefit'
  | 'question'
  | 'announcement'
  | 'number'
  | 'curiosity'
  | 'proof';

type Objective = 'offer' | 'launch' | 'awareness';

export interface CopyInput {
  product: string;
  offer?: string;
  vibe: string;
  category: string;
  objective?: Objective;
  rawPrompt?: string;
}

export interface CopyOutput {
  headline: string;
  subhead: string;
  cta: string;
  formula: HeadlineFormula;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const CHAR_LIMITS = {
  headline: 34,
  subhead: 62,
  cta: 16,
} as const;

function truncate(text: string, limit: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;

  const slice = normalized.slice(0, limit).trimEnd();
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > Math.floor(limit * 0.55)) {
    return slice.slice(0, lastSpace).trimEnd();
  }
  return slice;
}

function hasDiscount(offer?: string): boolean {
  if (!offer) return false;
  return /\d+%/.test(offer) || /\$\d+/.test(offer) || /\b(off|deal|save|sale)\b/i.test(offer);
}

function toTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function shortProduct(product: string): string {
  const cleaned = product
    .replace(/\b(the|a|an|and|for|with|new|premium)\b/gi, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Product';
}

function objectiveFromInput(input: CopyInput): Objective {
  if (input.objective) return input.objective;
  return hasDiscount(input.offer) ? 'offer' : 'awareness';
}

function isCompassionateContext(input: CopyInput): boolean {
  const text = `${input.product} ${input.rawPrompt ?? ''}`.toLowerCase();
  return /partingword|end[\s-]?of[\s-]?life|legacy|farewell|last message|final message|bereavement|grief|after i'?m gone|loved ones/.test(text);
}

type CompassionTheme =
  | 'core'
  | 'caregiver'
  | 'parents'
  | 'voice'
  | 'faith'
  | 'practical';

function detectCompassionTheme(input: CopyInput): CompassionTheme {
  const text = `${input.product} ${input.rawPrompt ?? ''}`.toLowerCase();

  if (/\b(caregiver|care team|family coordinator|coordinator)\b/.test(text)) return 'caregiver';
  if (/\b(parent|parents|younger family|kids|children)\b/.test(text)) return 'parents';
  if (/\b(voice|audio|record|spoken)\b/.test(text)) return 'voice';
  if (/\b(faith|blessing|values|spiritual|prayer)\b/.test(text)) return 'faith';
  if (/\b(guidance|instructions|practical|care notes|documents)\b/.test(text)) return 'practical';

  return 'core';
}

function hashSeed(parts: string[]): number {
  const text = parts.join('|').toLowerCase();
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickVariant<T>(options: T[], seed: number): T {
  return options[seed % options.length];
}

function pickWithinLimit(options: string[], seed: number, limit: number): string {
  if (options.length === 0) return '';
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

function offerToken(offer?: string): string {
  if (!offer) return 'Limited Offer';
  const pct = offer.match(/\d+%\s*off/i);
  if (pct) return pct[0];
  const dollars = offer.match(/\$\d+\s*off/i);
  if (dollars) return dollars[0];
  if (/free shipping/i.test(offer)) return 'Free Shipping';
  return offer.trim();
}

function formulaCandidates(input: CopyInput, objective: Objective): HeadlineFormula[] {
  const category = input.category.toLowerCase();
  const vibe = input.vibe.toLowerCase();

  if (objective === 'offer') return ['urgency', 'number', 'benefit'];
  if (objective === 'launch') return ['announcement', 'curiosity', 'question'];

  if (category === 'travel') return ['question', 'benefit', 'curiosity'];
  if (category === 'fitness') return ['number', 'benefit', 'proof'];
  if (category === 'tech') return ['benefit', 'proof', 'announcement'];
  if (vibe === 'luxury' || vibe === 'minimal') return ['announcement', 'curiosity', 'benefit'];

  return ['benefit', 'proof', 'curiosity'];
}

function selectFormula(input: CopyInput): HeadlineFormula {
  const objective = objectiveFromInput(input);
  const seed = hashSeed([input.product, input.offer ?? '', input.vibe, input.category, objective]);
  return pickVariant(formulaCandidates(input, objective), seed);
}

function generateHeadline(formula: HeadlineFormula, input: CopyInput, seed: number): string {
  const product = toTitleCase(shortProduct(input.product));
  const discount = offerToken(input.offer);

  switch (formula) {
    case 'urgency':
      return pickVariant(
        [
          `Today Only: ${discount}`,
          `${discount} on ${product}`,
          `Last Call: ${discount}`,
          `Limited Drop: ${discount}`,
        ],
        seed
      );
    case 'benefit':
      return pickVariant(
        [
          `${product}, Upgraded`,
          `Made for Better ${product}`,
          `Elevate Your ${product}`,
          `The Smarter ${product}`,
        ],
        seed
      );
    case 'question':
      return pickVariant(
        [
          `Ready for Better ${product}?`,
          `Still Settling on ${product}?`,
          `What If ${product} Felt Effortless?`,
        ],
        seed
      );
    case 'announcement':
      return pickVariant(
        [
          `Introducing ${product}`,
          `Meet the New ${product}`,
          `${product}, Reimagined`,
        ],
        seed
      );
    case 'number':
      return pickVariant(
        [
          `3 Reasons to Switch`,
          `Why ${product} Wins`,
          `Built to Go Further`,
        ],
        seed
      );
    case 'curiosity':
      return pickVariant(
        [
          `The ${product} Everyone Asks About`,
          `See What Makes It Different`,
          `Not Your Typical ${product}`,
        ],
        seed
      );
    case 'proof':
      return pickVariant(
        [
          `Performance You Can Feel`,
          `Designed to Deliver Daily`,
          `Built for Real Results`,
        ],
        seed
      );
  }
}

function generateSubhead(formula: HeadlineFormula, input: CopyInput, seed: number): string {
  const product = shortProduct(input.product);
  const offer = offerToken(input.offer);
  const objective = objectiveFromInput(input);

  const objectiveLead =
    objective === 'offer'
      ? `Secure ${offer} before it ends.`
      : objective === 'launch'
        ? `Early access to our newest ${product}.`
        : `A better take on everyday ${product}.`;

  const formulaLines: Record<HeadlineFormula, string[]> = {
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

function ctaCandidates(input: CopyInput, objective: Objective): string[] {
  const category = input.category.toLowerCase();

  if (objective === 'offer') {
    if (category === 'travel') return ['Book the Deal', 'Claim This Fare', 'Reserve & Save'];
    if (category === 'food') return ['Order the Offer', 'Claim This Combo', 'Taste & Save'];
    if (category === 'tech') return ['Unlock Savings', 'Claim the Drop', 'Get the Deal'];
    return ['Claim Offer', 'Unlock Savings', 'Save Today', 'Get the Deal'];
  }

  if (objective === 'launch') {
    if (category === 'fashion' || category === 'jewelry') return ['See the Drop', 'View Collection', 'Explore Launch'];
    if (category === 'tech') return ['See Features', 'Explore Launch', 'Try It Now'];
    if (category === 'beauty') return ['Try the Formula', 'See the Launch', 'Discover the Drop'];
    return ['Explore Launch', 'Be First In', 'Discover It'];
  }

  if (category === 'travel') return ['Plan Your Escape', 'Start Planning', 'Explore Stays'];
  if (category === 'food') return ['See the Menu', 'Order Pickup', 'Try It Today'];
  if (category === 'fitness') return ['Start Training', 'Join the Program', 'Train Smarter'];
  if (category === 'tech') return ['See Features', 'Explore Specs', 'Try It Now'];
  if (category === 'home') return ['Refresh Your Space', 'See the Setup', 'View Details'];

  return ['Learn More', 'See Why', 'Explore More', 'View Details'];
}

function selectCta(input: CopyInput): string {
  const objective = objectiveFromInput(input);
  const seed = hashSeed([input.product, input.offer ?? '', input.category, objective, 'cta']);
  return pickVariant(ctaCandidates(input, objective), seed);
}

function compassionateCopy(input: CopyInput): CopyOutput {
  const objective = objectiveFromInput(input);
  const seed = hashSeed([input.product, input.rawPrompt ?? '', input.vibe, input.category, objective, 'compassion']);
  const theme = detectCompassionTheme(input);

  const headlinesByTheme: Record<CompassionTheme, Record<Objective, string[]>> = {
    core: {
      offer: ['A Caring Way to Plan Ahead', 'Messages That Hold What Matters', 'Your Voice, Preserved With Care'],
      launch: ['A Gentle Way to Leave Words', 'Messages for the People You Love', 'Your Voice, Preserved With Care'],
      awareness: ['Messages for the People You Love', 'Plan Meaningful Messages Ahead', 'When Words Matter Most'],
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

  const subheadsByTheme: Record<CompassionTheme, Record<Objective, string[]>> = {
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

  const ctasByTheme: Record<CompassionTheme, Record<Objective, string[]>> = {
    core: {
      offer: ['Start a Message', 'Plan with Care', 'Write a Message'],
      launch: ['Write a Message', 'See the Process', 'Start with Care'],
      awareness: ['Learn the Process', 'Start a Message', 'See How It Works'],
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

  const headline = pickWithinLimit(themeHeadlines, seed, CHAR_LIMITS.headline);
  const subhead = pickWithinLimit(themeSubheads, seed + 3, CHAR_LIMITS.subhead);
  const cta = pickWithinLimit(themeCtas, seed + 5, CHAR_LIMITS.cta);

  return {
    headline,
    subhead,
    cta,
    formula: 'benefit',
  };
}

export function generateCopy(input: CopyInput): CopyOutput {
  if (isCompassionateContext(input)) {
    return compassionateCopy(input);
  }

  const objective = objectiveFromInput(input);
  const formula = selectFormula(input);
  const seed = hashSeed([input.product, input.offer ?? '', input.vibe, input.category, formula]);
  let headline = generateHeadline(formula, input, seed);
  if (
    objective === 'offer' &&
    input.offer &&
    !/\boff|deal|save|sale|offer\b/i.test(headline)
  ) {
    headline = `${offerToken(input.offer)} ${headline}`;
  }

  headline = truncate(headline, CHAR_LIMITS.headline);
  const subhead = truncate(generateSubhead(formula, input, seed), CHAR_LIMITS.subhead);
  const cta = truncate(selectCta(input), CHAR_LIMITS.cta);

  return { headline, subhead, cta, formula };
}

export const generateAdCopy = generateCopy;

export function validateCopy(copy: CopyOutput): ValidationResult {
  const errors: string[] = [];

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
