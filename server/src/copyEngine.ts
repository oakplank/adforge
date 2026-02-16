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
  headline: 36,
  subhead: 72,
  cta: 18,
} as const;

function truncate(text: string, limit: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return normalized.slice(0, limit - 1).trimEnd() + '…';
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
  const product = shortProduct(input.product);

  const headlinesByObjective: Record<Objective, string[]> = {
    offer: [
      'A Caring Way to Plan Ahead',
      'Messages That Hold What Matters',
      'Your Voice, Preserved With Care',
    ],
    launch: [
      'A Gentle Way to Leave Words',
      'Messages for the People You Love',
      'Your Voice, Preserved With Care',
    ],
    awareness: [
      'Messages for the People You Love',
      'Plan Meaningful Messages Ahead',
      'When Words Matter Most',
    ],
  };

  const subheadsByObjective: Record<Objective, string[]> = {
    offer: [
      'Create secure end-of-life messages with clarity, privacy, and compassion.',
      `Write guidance, memories, and care notes in one trusted ${product} space.`,
      'Prepare heartfelt messages now so loved ones have your words later.',
    ],
    launch: [
      'PartingWord helps you write secure legacy messages for future moments.',
      'Capture guidance, love, and practical notes for the people who matter most.',
      'A trusted space for end-of-life communication, written with intention.',
    ],
    awareness: [
      'Write future messages your loved ones can receive at the right time.',
      'A calm, secure place for legacy notes, care instructions, and reassurance.',
      'Turn meaningful thoughts into lasting messages your family can keep.',
    ],
  };

  const ctasByObjective: Record<Objective, string[]> = {
    offer: ['See How It Works', 'Start a Message', 'Explore PartingWord'],
    launch: ['See How It Works', 'Start a Message', 'Write a Message'],
    awareness: ['Learn the Process', 'Start a Message', 'Explore PartingWord'],
  };

  const headline = truncate(pickVariant(headlinesByObjective[objective], seed), CHAR_LIMITS.headline);
  const subhead = truncate(pickVariant(subheadsByObjective[objective], seed + 3), CHAR_LIMITS.subhead);
  const cta = truncate(pickVariant(ctasByObjective[objective], seed + 5), CHAR_LIMITS.cta);

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
