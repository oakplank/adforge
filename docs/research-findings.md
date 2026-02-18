# Meta/Instagram Ad Text Best Practices — Research Findings

## Text Style

High-performing Meta and Instagram ad creatives follow strict typographic rules to maximize readability and engagement on mobile devices.

1. **Use sans-serif fonts for primary copy.** Sans-serif typefaces (e.g., Helvetica, Inter, Montserrat) render more legibly at small sizes on mobile screens. Serif fonts lose detail below ~18px on 1080w canvases.

2. **Limit text to 20% of the image area.** Meta historically enforced a strict 20% text rule (rejecting ads exceeding it). As of 2021, the hard rejection was removed, but Meta's algorithm still penalizes text-heavy creatives with reduced delivery. Keep overlay text minimal — headline + CTA is ideal.

3. **Minimum font sizes: 24px for headlines, 14px for body at 1080px canvas width.** Text below these thresholds becomes illegible on mobile feeds. For Stories/Reels (1080×1920), scale proportionally — headlines ≥ 28px, body ≥ 16px.

4. **Use high-contrast text with background treatment.** White text on a semi-transparent dark overlay (or vice versa) ensures readability regardless of background image. Minimum contrast ratio: 4.5:1 (WCAG AA). Avoid placing text directly on busy photography without a scrim.

5. **Constrain line length to 15–25 characters per line for overlays.** Short punchy lines are scanned faster on mobile. Long paragraphs are never read in ad creative — use the caption/primary text for detail.

## Placement Hierarchy

Different Meta/Instagram placements have different dimensions, interaction patterns, and safe zones.

1. **Feed (1:1 or 4:5) is the primary placement — design for it first.** Feed posts occupy the most screen real estate at 4:5 (1080×1350). Square (1080×1080) is the universal fallback. Always design feed-first, then adapt.

2. **Stories/Reels (9:16, 1080×1920) require vertical-first design with safe zone awareness.** The top ~14% (≈270px) is occluded by the username/profile bar. The bottom ~35% (≈670px) is covered by the CTA button, swipe-up area, and message input. Core messaging must sit in the middle 51% (270px–1250px from top).

3. **Reels have an additional right-side danger zone.** The right 10–15% of Reels is occupied by like/comment/share icons. Keep critical text left-aligned or centered, away from the right gutter.

4. **Use placement asset customization — don't stretch one creative across all placements.** Meta Ads Manager allows per-placement creative. A single 1:1 image cropped to 9:16 will always perform worse than a native 9:16 creative. Design separate assets for feed vs. Stories/Reels.

5. **Carousel ads follow the same text rules but add sequential hierarchy.** First card = hook (bold headline, curiosity). Middle cards = value/features. Last card = CTA. Each card should work standalone but reward swiping.

## CTA Strategy

Calls-to-action are the single most impactful text element in ad creative. They bridge attention and action.

1. **Use one clear, action-oriented CTA per creative.** "Shop Now," "Get 50% Off," "Start Free Trial" outperform vague CTAs like "Learn More" by 30–50% on average. The CTA should answer: what will the user get by tapping?

2. **Position the CTA in the lower-center safe zone for feed, or mid-screen for Stories.** For feed: bottom-third, centered. For Stories: between 40%–65% from top (above the platform CTA button to avoid visual collision). Never place a custom CTA where it overlaps Meta's native "Shop Now" button.

3. **Use contrasting CTA button styling — pill shape, bold color, min 48px tap target.** CTA buttons should be visually distinct from all other creative elements. High-contrast background color (brand accent), rounded corners (8–16px radius), and padding (12px vertical, 24px horizontal minimum).

4. **Urgency and specificity boost CTAs.** "Get 50% Off Today" > "Shop Now" > "Learn More". Time-bound or value-specific CTAs create urgency without feeling spammy when truthful.

5. **Don't use more than one CTA in a single frame.** Multiple CTAs create decision paralysis. One frame, one action. If you need multiple paths, use carousel cards.

## Branding

Consistent brand presence builds recognition and trust without overwhelming the promotional message.

1. **Logo placement: top-left or top-right corner, max 10% of canvas area.** The logo should be present but not dominant. Place it in a consistent position across all creatives in a campaign. Use a simplified/icon version for small placements.

2. **Use a maximum of 2 brand colors + 1 neutral in any single creative.** Over-coloring dilutes the message. Primary brand color for CTA/accents, secondary for text/backgrounds, neutral (white/black/gray) for body copy. This creates a predictable visual system.

3. **Maintain consistent typography across campaigns — max 2 font families.** One font for headlines (can be a display/brand font), one for body/CTA (clean sans-serif). Mixing more than 2 fonts looks unprofessional and harms brand recognition.

4. **Brand elements should be tokenized for automation.** Define brand colors, fonts, logo assets, and spacing as reusable tokens/variables. This ensures consistency when generating ads programmatically and makes brand updates trivial.

## Safe Zones

Safe zones define where text and critical elements can be placed without being occluded by platform UI.

1. **Feed (1:1, 1080×1080): All edges have ~5% margin safety. Keep text within 54px–1026px on both axes.** Feed posts are relatively safe, but rounded corners on some devices clip the extreme corners. Apply 5% (54px) padding on all sides.

2. **Stories (9:16, 1080×1920): Top 14% unsafe, bottom 35% unsafe.** Top safe boundary: 270px from top. Bottom safe boundary: 1250px from top. Left/right: 5% (54px) margins. The usable text area is roughly 972px wide × 980px tall, centered vertically around the 760px midpoint.

3. **Reels (9:16, 1080×1920): Same vertical constraints as Stories, plus right 15% unsafe.** Right-side icons (like, comment, share, audio) occupy approximately 150px from the right edge. Safe text area: 54px to 876px horizontally, 270px to 1250px vertically.

4. **Always test with a safe zone overlay before publishing.** Render a semi-transparent mask showing unsafe areas during the design/preview phase. This prevents costly mistakes and re-uploads.

5. **Account for dynamic text truncation on smaller devices.** Even within safe zones, very long text blocks may render differently on smaller phones (iPhone SE vs. iPhone Pro Max). Test at 375px viewport width equivalent.

## Do/Donts

Practical rules distilled from the research above, with rationale.

### Do

1. **DO keep overlay text under 20% of image area.** Meta's algorithm delivers text-light creatives to more people at lower cost. Even though the hard rule was removed, text-heavy ads see 30–60% reduced reach.

2. **DO use a visual hierarchy: Headline → Subhead → CTA.** The eye should flow naturally from the hook (headline) to the value prop (subhead) to the action (CTA). Size ratio: headline 2×, subhead 1.2×, body 1×.

3. **DO design mobile-first at 1080px width.** Over 95% of Meta/Instagram ad impressions are on mobile. Desktop is an afterthought. Always preview at mobile scale.

4. **DO use dynamic font sizing with min/max clamps.** `clamp(14px, 2.5vw, 24px)` style sizing ensures text scales appropriately across placements without becoming too small or too large.

### Don't

1. **DON'T place critical text in the top 14% or bottom 35% of Stories/Reels.** This text will be hidden by platform UI elements. It's wasted creative effort and can look broken.

2. **DON'T use more than 3 lines of overlay text.** More than 3 lines triggers the "too much text" perception and reduces engagement. Move detailed copy to the primary text (caption) field.

3. **DON'T use thin/light font weights below 18px.** Light (300) and thin (100) weights become illegible at small sizes on mobile, especially on lower-resolution Android devices. Use regular (400) minimum, medium/semibold (500–600) preferred.

4. **DON'T forget to test across feed, Stories, and Reels placements.** A creative that looks great in feed may have text completely hidden in Stories. Always verify all target placements.
