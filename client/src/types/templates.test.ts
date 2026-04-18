import { describe, it, expect } from 'vitest';
import {
  BUILT_IN_TEMPLATES,
  getTemplateById,
  getAllTemplates,
  mapTemplateToFormat,
  type AdTemplate,
  type SlotType,
} from './templates';

const SLOT_TYPES: SlotType[] = ['headline', 'subhead', 'cta', 'logo', 'productImage', 'background'];
const FORMAT_IDS = ['square', 'portrait', 'story'];

describe('AdTemplate types and built-in templates', () => {
  it('has exactly 5 built-in templates', () => {
    expect(BUILT_IN_TEMPLATES).toHaveLength(5);
  });

  it('templates have expected names', () => {
    const names = BUILT_IN_TEMPLATES.map((t) => t.name);
    expect(names).toContain('Bold Sale');
    expect(names).toContain('Product Showcase');
    expect(names).toContain('Minimal');
  });

  it.each(BUILT_IN_TEMPLATES.map((t) => [t.name, t]))(
    '%s has all 6 slot types',
    (_name, template) => {
      const t = template as AdTemplate;
      const types = t.slots.map((s) => s.type);
      for (const slotType of SLOT_TYPES) {
        expect(types).toContain(slotType);
      }
    },
  );

  it.each(BUILT_IN_TEMPLATES.map((t) => [t.name, t]))(
    '%s has position data for all 3 IG formats in every slot',
    (_name, template) => {
      const t = template as AdTemplate;
      for (const slot of t.slots) {
        for (const fmtId of FORMAT_IDS) {
          const pos = slot.positions[fmtId];
          expect(pos, `${t.name} / ${slot.type} missing ${fmtId}`).toBeDefined();
          expect(pos.width).toBeGreaterThan(0);
          expect(pos.height).toBeGreaterThan(0);
        }
      }
    },
  );

  it('background slot is always full-size and locked', () => {
    for (const t of BUILT_IN_TEMPLATES) {
      const bg = t.slots.find((s) => s.type === 'background')!;
      expect(bg.constraints.locked).toBe(true);
      expect(bg.constraints.required).toBe(true);
      expect(bg.positions.square).toEqual({ x: 0, y: 0, width: 1080, height: 1080 });
      expect(bg.positions.portrait).toEqual({ x: 0, y: 0, width: 1080, height: 1350 });
      expect(bg.positions.story).toEqual({ x: 0, y: 0, width: 1080, height: 1920 });
    }
  });
});

describe('getTemplateById', () => {
  it('returns template by id', () => {
    const t = getTemplateById('bold-sale');
    expect(t).toBeDefined();
    expect(t!.name).toBe('Bold Sale');
  });

  it('returns undefined for unknown id', () => {
    expect(getTemplateById('nonexistent')).toBeUndefined();
  });
});

describe('getAllTemplates', () => {
  it('returns a copy of all templates', () => {
    const all = getAllTemplates();
    expect(all).toHaveLength(5);
    expect(all).not.toBe(BUILT_IN_TEMPLATES); // copy
  });
});

describe('mapTemplateToFormat', () => {
  it('maps template slots to square format', () => {
    const template = getTemplateById('bold-sale')!;
    const mapped = mapTemplateToFormat(template, 'square');
    expect(mapped).toHaveLength(6);
    for (const slot of mapped) {
      expect(slot.position).toBeDefined();
      expect(slot.position.width).toBeGreaterThan(0);
    }
  });

  it('maps template slots to story format with correct dimensions', () => {
    const template = getTemplateById('minimal')!;
    const mapped = mapTemplateToFormat(template, 'story');
    const bg = mapped.find((s) => s.type === 'background')!;
    expect(bg.position).toEqual({ x: 0, y: 0, width: 1080, height: 1920 });
  });

  it('preserves style and constraints in mapped slots', () => {
    const template = getTemplateById('product-showcase')!;
    const mapped = mapTemplateToFormat(template, 'portrait');
    const headline = mapped.find((s) => s.type === 'headline')!;
    expect(headline.style.fontSize).toBe(48);
    expect(headline.style.fontWeight).toBe('700');
    const cta = mapped.find((s) => s.type === 'cta')!;
    expect(cta.constraints.required).toBe(true);
  });

  it('throws for unknown format', () => {
    const template = getTemplateById('bold-sale')!;
    expect(() => mapTemplateToFormat(template, 'unknown')).toThrow('no position data');
  });
});
