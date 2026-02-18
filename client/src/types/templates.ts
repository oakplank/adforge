// Slot types for ad anatomy
export type SlotType = 'headline' | 'subhead' | 'cta' | 'logo' | 'productImage' | 'background';

export interface SlotPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SlotStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  textAlign?: string;
  shadow?: string;
}

export interface SlotConstraints {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  locked?: boolean;
  required?: boolean;
}

export interface TemplateSlot {
  type: SlotType;
  label: string;
  positions: Record<string, SlotPosition>; // keyed by format id (square, portrait, story)
  style: SlotStyle;
  constraints: SlotConstraints;
}

export interface AdTemplate {
  id: string;
  name: string;
  description: string;
  slots: TemplateSlot[];
}

// Canvas layer mapped from a template slot
export interface MappedSlot {
  type: SlotType;
  label: string;
  position: SlotPosition;
  style: SlotStyle;
  constraints: SlotConstraints;
}

/**
 * Load a template's slots for a specific format, returning MappedSlots
 */
export function mapTemplateToFormat(template: AdTemplate, formatId: string): MappedSlot[] {
  return template.slots.map((slot) => {
    const position = slot.positions[formatId];
    if (!position) {
      throw new Error(`Template "${template.name}" has no position data for format "${formatId}"`);
    }
    return {
      type: slot.type,
      label: slot.label,
      position,
      style: slot.style,
      constraints: slot.constraints,
    };
  });
}

/**
 * Get a built-in template by ID
 */
export function getTemplateById(id: string): AdTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all built-in templates
 */
export function getAllTemplates(): AdTemplate[] {
  return [...BUILT_IN_TEMPLATES];
}

// ── Built-in Templates ──

const BOLD_SALE: AdTemplate = {
  id: 'bold-sale',
  name: 'Bold Sale',
  description: 'High-impact sale template with large headline and prominent CTA',
  slots: [
    {
      type: 'background',
      label: 'Background Image',
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
      label: 'Sale Headline',
      positions: {
        square:   { x: 90, y: 120, width: 900, height: 200 },
        portrait: { x: 90, y: 150, width: 900, height: 220 },
        story:    { x: 90, y: 300, width: 900, height: 260 },
      },
      style: { fontSize: 72, fontFamily: 'Space Grotesk', fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
      constraints: { required: true, minWidth: 400 },
    },
    {
      type: 'subhead',
      label: 'Subheadline',
      positions: {
        square:   { x: 140, y: 340, width: 800, height: 80 },
        portrait: { x: 140, y: 400, width: 800, height: 80 },
        story:    { x: 140, y: 580, width: 800, height: 100 },
      },
      style: { fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: '400', color: '#E0E0E0', textAlign: 'center' },
      constraints: { required: false },
    },
    {
      type: 'productImage',
      label: 'Product Image',
      positions: {
        square:   { x: 240, y: 440, width: 600, height: 360 },
        portrait: { x: 190, y: 500, width: 700, height: 500 },
        story:    { x: 140, y: 720, width: 800, height: 700 },
      },
      style: {},
      constraints: { required: false, minWidth: 200, minHeight: 200 },
    },
    {
      type: 'cta',
      label: 'Call to Action',
      positions: {
        square:   { x: 290, y: 860, width: 500, height: 80 },
        portrait: { x: 290, y: 1100, width: 500, height: 80 },
        story:    { x: 240, y: 1520, width: 600, height: 100 },
      },
      style: { fontSize: 24, fontFamily: 'Space Grotesk', fontWeight: '700', color: '#FFFFFF', backgroundColor: '#FF4444', borderRadius: 12, textAlign: 'center' },
      constraints: { required: true, minWidth: 200 },
    },
    {
      type: 'logo',
      label: 'Brand Logo',
      positions: {
        square:   { x: 440, y: 960, width: 200, height: 80 },
        portrait: { x: 440, y: 1220, width: 200, height: 80 },
        story:    { x: 440, y: 1700, width: 200, height: 80 },
      },
      style: {},
      constraints: { required: false, maxWidth: 300, maxHeight: 150 },
    },
  ],
};

const PRODUCT_SHOWCASE: AdTemplate = {
  id: 'product-showcase',
  name: 'Product Showcase',
  description: 'Product-focused template with centered hero image and clean typography',
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
      type: 'productImage',
      label: 'Hero Product',
      positions: {
        square:   { x: 140, y: 80, width: 800, height: 600 },
        portrait: { x: 90, y: 80, width: 900, height: 750 },
        story:    { x: 90, y: 200, width: 900, height: 900 },
      },
      style: {},
      constraints: { required: true, minWidth: 300, minHeight: 300 },
    },
    {
      type: 'headline',
      label: 'Product Name',
      positions: {
        square:   { x: 90, y: 720, width: 900, height: 100 },
        portrait: { x: 90, y: 880, width: 900, height: 100 },
        story:    { x: 90, y: 1160, width: 900, height: 120 },
      },
      style: { fontSize: 48, fontFamily: 'Space Grotesk', fontWeight: '700', color: '#FFFFFF', textAlign: 'left' },
      constraints: { required: true },
    },
    {
      type: 'subhead',
      label: 'Product Description',
      positions: {
        square:   { x: 90, y: 830, width: 700, height: 60 },
        portrait: { x: 90, y: 990, width: 700, height: 60 },
        story:    { x: 90, y: 1300, width: 800, height: 80 },
      },
      style: { fontSize: 22, fontFamily: 'Space Grotesk', fontWeight: '400', color: '#AAAAAA', textAlign: 'left' },
      constraints: { required: false },
    },
    {
      type: 'cta',
      label: 'Shop Now',
      positions: {
        square:   { x: 90, y: 920, width: 300, height: 64 },
        portrait: { x: 90, y: 1100, width: 300, height: 64 },
        story:    { x: 90, y: 1440, width: 360, height: 80 },
      },
      style: { fontSize: 20, fontFamily: 'Space Grotesk', fontWeight: '600', color: '#000000', backgroundColor: '#FFFFFF', borderRadius: 8, textAlign: 'center' },
      constraints: { required: true, minWidth: 150 },
    },
    {
      type: 'logo',
      label: 'Brand Logo',
      positions: {
        square:   { x: 840, y: 920, width: 150, height: 60 },
        portrait: { x: 840, y: 1100, width: 150, height: 60 },
        story:    { x: 830, y: 1780, width: 160, height: 60 },
      },
      style: {},
      constraints: { required: false, maxWidth: 200, maxHeight: 100 },
    },
  ],
};

const MINIMAL: AdTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean, minimalist template with generous whitespace',
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
        square:   { x: 120, y: 200, width: 840, height: 140 },
        portrait: { x: 120, y: 250, width: 840, height: 140 },
        story:    { x: 120, y: 400, width: 840, height: 160 },
      },
      style: { fontSize: 56, fontFamily: 'Space Grotesk', fontWeight: '300', color: '#FFFFFF', textAlign: 'center' },
      constraints: { required: true },
    },
    {
      type: 'subhead',
      label: 'Subtitle',
      positions: {
        square:   { x: 200, y: 370, width: 680, height: 60 },
        portrait: { x: 200, y: 420, width: 680, height: 60 },
        story:    { x: 200, y: 590, width: 680, height: 70 },
      },
      style: { fontSize: 20, fontFamily: 'Space Grotesk', fontWeight: '400', color: '#999999', textAlign: 'center' },
      constraints: { required: false },
    },
    {
      type: 'productImage',
      label: 'Product',
      positions: {
        square:   { x: 290, y: 460, width: 500, height: 350 },
        portrait: { x: 240, y: 520, width: 600, height: 480 },
        story:    { x: 190, y: 720, width: 700, height: 650 },
      },
      style: {},
      constraints: { required: false },
    },
    {
      type: 'cta',
      label: 'Learn More',
      positions: {
        square:   { x: 370, y: 870, width: 340, height: 56 },
        portrait: { x: 370, y: 1080, width: 340, height: 56 },
        story:    { x: 340, y: 1480, width: 400, height: 70 },
      },
      style: { fontSize: 18, fontFamily: 'Space Grotesk', fontWeight: '500', color: '#FFFFFF', backgroundColor: 'transparent', borderRadius: 28, textAlign: 'center', shadow: '0 0 0 2px #FFFFFF' },
      constraints: { required: true },
    },
    {
      type: 'logo',
      label: 'Logo',
      positions: {
        square:   { x: 470, y: 960, width: 140, height: 56 },
        portrait: { x: 470, y: 1200, width: 140, height: 56 },
        story:    { x: 470, y: 1700, width: 140, height: 56 },
      },
      style: {},
      constraints: { required: false, maxWidth: 180, maxHeight: 80 },
    },
  ],
};

import { BEFORE_TEMPLATE, AFTER_TEMPLATE } from './exampleTemplates';

export const BUILT_IN_TEMPLATES: AdTemplate[] = [BOLD_SALE, PRODUCT_SHOWCASE, MINIMAL, BEFORE_TEMPLATE, AFTER_TEMPLATE];
