# AdForge Text System Style Guide

## Typography

The text system uses a four-level typographic hierarchy. All sizes are in pixels and enforced via dynamic clamping.

| Role | Min | Max | Default | Line Height | Max Chars |
|------|-----|-----|---------|-------------|-----------|
| Headline | 24px | 72px | 48px | 1.1 | 25 |
| Subhead | 18px | 48px | 28px | 1.25 | 40 |
| Body | 14px | 32px | 18px | 1.45 | 60 |
| CTA | 16px | 36px | 22px | 1.2 | 20 |

### Rules

1. **Never go below minimum sizes.** The `calculateDynamicFontSize` engine enforces clamps automatically — do not bypass them.
2. **Respect max character counts.** Truncate or rewrite copy that exceeds `maxChars` for the role. Overflow degrades readability on mobile.
3. **Headline must always be larger than subhead.** Maintain at least a 1.3× ratio between headline and subhead `default` sizes.
4. **Use negative letter-spacing for headlines** (`-0.02em`) and neutral for body (`0em`). This improves scan-ability at large sizes.
5. **Line height decreases as role prominence increases.** Headlines use 1.1, body uses 1.45. Do not flatten body line height.

## Safe Zones

Safe zones prevent text from being clipped by UI chrome (profile icons, swipe-up areas, navigation bars).

| Format | Top | Bottom | Left | Right | Canvas |
|--------|-----|--------|------|-------|--------|
| Feed (1080×1080) | 5% | 10% | 5% | 5% | 1080×1080 |
| Story (1080×1920) | 14% | 35% | 5% | 5% | 1080×1920 |
| Reel (1080×1920) | 10% | 35% | 5% | 15% | 1080×1920 |

### Rules

1. **All text layers must be placed within safe zone boundaries.** Use `SAFE_ZONE_SPECS` from `designTokens.ts` — never hardcode pixel offsets.
2. **Stories have the most restrictive zones.** The bottom 35% is reserved for swipe-up/CTA overlays; never place body copy there.
3. **Reels require extra right margin (15%)** due to the interaction column (like, comment, share icons).
4. **CTA buttons should sit just above the bottom safe zone boundary**, not inside the unsafe area.
5. **Test every format.** A layout that works in feed will likely clip in story/reel without adjustment.

## CTA

Call-to-action elements are generated via the `ctaModule.ts` module using token-based styling.

### Rules

1. **CTA text must be ≤20 characters.** Short, action-oriented verbs: "Shop Now", "Learn More", "Get 50% Off".
2. **Use the accent color (`#E94560`) as the default CTA background.** It provides sufficient contrast against both light and dark overlays (minimum 4.5:1 ratio).
3. **CTA padding uses spacing tokens:** horizontal `lg` (24px), vertical `sm` (8px). Do not use arbitrary padding.
4. **Corner radius is fixed at 8px** for brand consistency across all ad formats.
5. **For conversion intent, CTA font size increases to 28px.** For awareness, it decreases to 18px. Use `getPresetForIntent()` to get the right config.
6. **Always include a CTA.** Even awareness ads benefit from a subtle, low-emphasis call to action.

## Brand Tokens

All colors, spacing, and typography values are centralized in `designTokens.ts` as the single source of truth.

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#1A1A2E` | Dark backgrounds, headline text on light |
| `secondary` | `#16213E` | Secondary backgrounds, card fills |
| `accent` | `#E94560` | CTA buttons, emphasis highlights |
| `text` | `#FFFFFF` | Primary text on dark backgrounds |
| `background` | `#0F3460` | Default canvas background |

### Spacing Tokens

`xs` (4px), `sm` (8px), `md` (16px), `lg` (24px), `xl` (32px), `xxl` (48px).

### Rules

1. **Never use raw hex values in layout code.** Always reference `COLOR_TOKENS.accent`, not `'#E94560'`.
2. **Never use magic-number spacing.** Use `SPACING_TOKENS.md` instead of `16`.
3. **When adding new tokens, add them to `designTokens.ts` and update this guide.**
4. **Typography tokens are accessed via `TYPOGRAPHY_SCALE[role]`** where role is `headline`, `subhead`, `body`, or `cta`.

## Intent Presets

Three built-in presets configure the entire text system for different advertising goals.

### Conversion
- **Goal:** Direct response, maximize clicks
- **CTA emphasis:** High (28px, prominent accent color)
- **Headline:** Shorter (20 char max), urgency-focused
- **Body:** Concise (45 char max)
- **Use when:** Product launches, flash sales, app installs

### Awareness
- **Goal:** Brand storytelling, maximize reach
- **CTA emphasis:** Low (18px, subtle)
- **Headline:** Large (56px default, up to 72px), narrative-driven
- **Body:** Longer allowed (default maxChars)
- **Use when:** Brand campaigns, seasonal storytelling, new audience reach

### Retargeting
- **Goal:** Re-engagement, win back warm audiences
- **CTA emphasis:** Medium (24px)
- **Headline:** Balanced (44px default)
- **Body:** Standard
- **Use when:** Cart abandonment, re-engagement sequences, loyalty offers

### Rules

1. **Always pass an intent when generating ads.** The `generateLayout(format, intent)` function accepts an optional `AdIntent` parameter.
2. **Presets override typography defaults** — they do not replace the entire token system. Base clamps still apply.
3. **To create a custom preset,** extend the `AdIntentPreset` type and add it to `AD_INTENT_PRESETS` in `designTokens.ts`.
4. **Intent affects copy strategy too.** The `copyEngine` selects headline formulas based on `preferredHeadlineFormulas` from the preset config.
