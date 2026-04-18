# AdForge Text System — Usage Examples

## Example 1: Generate an Ad with Intent

Use the `generateLayout` function with an intent parameter to automatically apply the correct typographic hierarchy and CTA emphasis.

```typescript
import { generateLayout } from './layoutEngine.js';

// Generate a conversion-optimized feed ad
const layout = generateLayout('feed', 'conversion');

console.log(layout.headline.fontSize); // 42 (conversion preset default)
console.log(layout.cta.fontSize);      // 28 (high emphasis)

// Generate an awareness story ad
const storyLayout = generateLayout('story', 'awareness');

console.log(storyLayout.headline.fontSize); // 56 (large, narrative-driven)
console.log(storyLayout.cta.fontSize);      // 18 (subtle)
```

## Example 2: Use Design Tokens for Consistent Styling

Import tokens directly from `designTokens.ts` instead of hardcoding values.

```typescript
import {
  TYPOGRAPHY_SCALE,
  COLOR_TOKENS,
  SPACING_TOKENS,
  SAFE_ZONE_SPECS,
} from './designTokens.js';

// Get headline constraints
const headline = TYPOGRAPHY_SCALE.headline;
console.log(headline.min, headline.max, headline.default); // 24, 72, 48

// Use color tokens for CTA
const ctaStyle = {
  backgroundColor: COLOR_TOKENS.accent,    // '#E94560'
  color: COLOR_TOKENS.text,                // '#FFFFFF'
  paddingInline: SPACING_TOKENS.lg,        // 24
  paddingBlock: SPACING_TOKENS.sm,         // 8
};

// Get safe zone for stories
const storySafeZone = SAFE_ZONE_SPECS.find(s => s.format === 'story');
console.log(storySafeZone?.bottomPercent); // 35 — no text below this line
```

## Example 3: Create a Custom Intent Preset

Extend the preset system by adding your own intent configuration.

```typescript
import type { AdIntentPreset } from './types/textSystem.js';
import { AD_INTENT_PRESETS } from './designTokens.js';

// Define a custom "seasonal" preset
const seasonalPreset: AdIntentPreset = {
  intent: 'seasonal',
  description: 'Holiday/seasonal campaigns — festive, balanced emphasis',
  ctaEmphasis: 'medium',
  typography: {
    headline: { default: 50, max: 68 },
    subhead: { default: 30 },
    body: { default: 18 },
    cta: { default: 24 },
  },
};

// Register it (extend at runtime)
AD_INTENT_PRESETS['seasonal'] = seasonalPreset;

// Now use it in layout generation
import { getPresetForIntent, applyPresetToLayout } from './intentPresets.js';
import { generateLayout } from './layoutEngine.js';

const baseLayout = generateLayout('feed');
const adjusted = applyPresetToLayout(baseLayout, seasonalPreset);
```

## Example 4: Validate Text Placement in Safe Zones

Use the text sizing engine to ensure text fits within safe zones before rendering.

```typescript
import { calculateDynamicFontSize } from './textSizingEngine.js';
import { TYPOGRAPHY_SCALE, SAFE_ZONE_SPECS } from './designTokens.js';

const format = 'reel';
const safeZone = SAFE_ZONE_SPECS.find(s => s.format === format)!;

// Calculate available height for text (excluding unsafe areas)
const availableHeight = safeZone.height * (1 - safeZone.topPercent / 100 - safeZone.bottomPercent / 100);
const availableWidth = safeZone.width * (1 - safeZone.leftPercent / 100 - safeZone.rightPercent / 100);

console.log(`Safe area: ${availableWidth}px × ${availableHeight}px`);
// Reel: 864px × 1056px

// Calculate font size that fits the container
const headlineSize = calculateDynamicFontSize(
  'headline',
  { width: availableWidth, height: availableHeight },
  TYPOGRAPHY_SCALE.headline
);

console.log(`Headline size for reel: ${headlineSize}px`);
// Will be clamped between 24px and 72px
```

## Example 5: Generate CTA with Token-Based Styling

Use the CTA module for consistent button generation across all ad formats.

```typescript
import { generateCtaBlock } from './ctaModule.js';
import { getPresetForIntent } from './intentPresets.js';

// Generate CTA for a conversion ad
const preset = getPresetForIntent('conversion');
const cta = generateCtaBlock('Shop Now', preset);

console.log(cta);
// {
//   text: 'Shop Now',
//   fontSize: 28,
//   emphasis: 'high',
//   ...token-based styles
// }
```
