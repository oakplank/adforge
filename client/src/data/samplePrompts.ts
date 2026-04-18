/**
 * Sample prompts that users can click to try the app
 */
export interface SamplePrompt {
  id: string;
  prompt: string;
  category: string;
  description: string;
}

export const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'summer-sale',
    prompt: 'Summer sale 30% off beachwear, energetic vibe, orange and teal',
    category: 'Sale',
    description: 'Energetic summer sale with vibrant colors',
  },
  {
    id: 'product-launch',
    prompt: 'Premium wireless headphones launch, luxury vibe, gold and black',
    category: 'Launch',
    description: 'High-end product launch with luxury aesthetics',
  },
  {
    id: 'event-promo',
    prompt: 'Tech conference 2025 early bird tickets, professional vibe, blue and white',
    category: 'Event',
    description: 'Professional event promotion',
  },
  {
    id: 'food-delivery',
    prompt: 'Free delivery on your first order, fresh vibe, green and white',
    category: 'Food',
    description: 'Food delivery promotional ad',
  },
  {
    id: 'fitness-challenge',
    prompt: '30-day fitness challenge join now, bold vibe, red and black',
    category: 'Fitness',
    description: 'Bold fitness challenge promotion',
  },
  {
    id: 'fashion-collection',
    prompt: 'New spring fashion collection, minimal vibe, cream and beige',
    category: 'Fashion',
    description: 'Minimalist fashion collection showcase',
  },
  {
    id: 'app-download',
    prompt: 'Download our app get 50% off, playful vibe, purple and pink',
    category: 'Tech',
    description: 'Playful app download promotion',
  },
  {
    id: 'holiday-special',
    prompt: 'Holiday special BOGO offer, warm vibe, red and gold',
    category: 'Holiday',
    description: 'Warm holiday season promotion',
  },
];

/**
 * Get prompts by category
 */
export function getPromptsByCategory(category: string): SamplePrompt[] {
  return SAMPLE_PROMPTS.filter((p) => p.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  return [...new Set(SAMPLE_PROMPTS.map((p) => p.category))];
}
