import type { AdTemplate } from './templates';

/**
 * BEFORE template — demonstrates old-style flat sizing problems:
 * - All text slots use the same font size (no hierarchy)
 * - Same font weight throughout
 * - Story text positioned outside safe zones (top 14%, bottom 35%)
 */
export const BEFORE_TEMPLATE: AdTemplate = {
  id: 'example-before',
  name: 'Example: Before (Flat)',
  description: 'Demonstrates old-style flat text sizing with no hierarchy and unsafe positioning',
  slots: [
    {
      type: 'background',
      label: 'Background',
      positions: {
        square:   { x: 0, y: 0, width: 1080, height: 1080 },
        portrait: { x: 0, y: 0, width: 1080, height: 1350 },
        story:    { x: 0, y: 0, width: 1080, height: 1920 },
      },
      style: {},
      constraints: { locked: true, required: true },
    },
    {
      type: 'headline',
      label: 'Headline',
      positions: {
        square:   { x: 90, y: 40, width: 900, height: 100 },   // near top edge
        portrait: { x: 90, y: 40, width: 900, height: 100 },
        story:    { x: 90, y: 60, width: 900, height: 100 },    // OUTSIDE top safe zone (14% of 1920 = 268)
      },
      style: { fontSize: 32, fontFamily: 'Arial', fontWeight: '400', color: '#FFFFFF', textAlign: 'left' },
      constraints: { required: true },
    },
    {
      type: 'subhead',
      label: 'Subhead',
      positions: {
        square:   { x: 90, y: 160, width: 900, height: 60 },
        portrait: { x: 90, y: 160, width: 900, height: 60 },
        story:    { x: 90, y: 180, width: 900, height: 60 },    // OUTSIDE top safe zone
      },
      style: { fontSize: 32, fontFamily: 'Arial', fontWeight: '400', color: '#FFFFFF', textAlign: 'left' },
      constraints: { required: false },
    },
    {
      type: 'productImage',
      label: 'Product',
      positions: {
        square:   { x: 240, y: 300, width: 600, height: 400 },
        portrait: { x: 190, y: 300, width: 700, height: 550 },
        story:    { x: 140, y: 500, width: 800, height: 700 },
      },
      style: {},
      constraints: { required: false },
    },
    {
      type: 'cta',
      label: 'CTA',
      positions: {
        square:   { x: 300, y: 780, width: 480, height: 70 },
        portrait: { x: 300, y: 950, width: 480, height: 70 },
        story:    { x: 300, y: 1400, width: 480, height: 70 },  // OUTSIDE bottom safe zone (65% of 1920 = 1248 max y)
      },
      style: { fontSize: 32, fontFamily: 'Arial', fontWeight: '400', color: '#FFFFFF', backgroundColor: '#666666', borderRadius: 4, textAlign: 'center' },
      constraints: { required: true },
    },
    {
      type: 'logo',
      label: 'Logo',
      positions: {
        square:   { x: 460, y: 900, width: 160, height: 60 },
        portrait: { x: 460, y: 1100, width: 160, height: 60 },
        story:    { x: 460, y: 1750, width: 160, height: 60 },  // OUTSIDE bottom safe zone
      },
      style: {},
      constraints: { required: false },
    },
  ],
};

/**
 * AFTER template — demonstrates new token-based hierarchy:
 * - Clear font size progression: headline (64) > subhead (28) > cta (22)
 * - Appropriate font weights for each role
 * - All text within safe zones for all formats
 * - Proper CTA prominence with contrast color
 */
export const AFTER_TEMPLATE: AdTemplate = {
  id: 'example-after',
  name: 'Example: After (Hierarchy)',
  description: 'Demonstrates new token-based text hierarchy with safe zone compliance',
  slots: [
    {
      type: 'background',
      label: 'Background',
      positions: {
        square:   { x: 0, y: 0, width: 1080, height: 1080 },
        portrait: { x: 0, y: 0, width: 1080, height: 1350 },
        story:    { x: 0, y: 0, width: 1080, height: 1920 },
      },
      style: {},
      constraints: { locked: true, required: true },
    },
    {
      type: 'headline',
      label: 'Headline',
      positions: {
        square:   { x: 108, y: 140, width: 864, height: 160 },
        portrait: { x: 108, y: 175, width: 864, height: 160 },
        story:    { x: 152, y: 320, width: 776, height: 180 },
      },
      style: { fontSize: 64, fontFamily: 'Space Grotesk', fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
      constraints: { required: true, minWidth: 400 },
    },
    {
      type: 'subhead',
      label: 'Subhead',
      positions: {
        square:   { x: 162, y: 320, width: 756, height: 70 },
        portrait: { x: 162, y: 360, width: 756, height: 70 },
        story:    { x: 162, y: 520, width: 756, height: 80 },
      },
      style: { fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: '400', color: '#CCCCCC', textAlign: 'center' },
      constraints: { required: false },
    },
    {
      type: 'productImage',
      label: 'Product',
      positions: {
        square:   { x: 190, y: 420, width: 700, height: 380 },
        portrait: { x: 140, y: 470, width: 800, height: 520 },
        story:    { x: 140, y: 650, width: 800, height: 500 },
      },
      style: {},
      constraints: { required: false, minWidth: 200, minHeight: 200 },
    },
    {
      type: 'cta',
      label: 'Call to Action',
      positions: {
        square:   { x: 310, y: 860, width: 460, height: 72 },
        portrait: { x: 310, y: 1080, width: 460, height: 72 },
        story:    { x: 280, y: 1100, width: 520, height: 80 },  // within bottom safe (1248px max y+h)
      },
      style: { fontSize: 22, fontFamily: 'Space Grotesk', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#FF3B30', borderRadius: 12, textAlign: 'center' },
      constraints: { required: true, minWidth: 200 },
    },
    {
      type: 'logo',
      label: 'Logo',
      positions: {
        square:   { x: 440, y: 950, width: 200, height: 70 },
        portrait: { x: 440, y: 1180, width: 200, height: 70 },
        story:    { x: 440, y: 1160, width: 200, height: 70 },  // within bottom safe
      },
      style: {},
      constraints: { required: false, maxWidth: 250, maxHeight: 100 },
    },
  ],
};
