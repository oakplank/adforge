import { describe, it, expect } from 'vitest';
import { BEFORE_TEMPLATE, AFTER_TEMPLATE } from './exampleTemplates';
import { BUILT_IN_TEMPLATES, mapTemplateToFormat } from './templates';
import { getSafeZonePixels } from './safeZones';

const FORMATS = [
  { id: 'square', width: 1080, height: 1080 },
  { id: 'portrait', width: 1080, height: 1350 },
  { id: 'story', width: 1080, height: 1920 },
];

describe('exampleTemplates', () => {
  describe('exports', () => {
    it('exports BEFORE_TEMPLATE', () => {
      expect(BEFORE_TEMPLATE).toBeDefined();
      expect(BEFORE_TEMPLATE.id).toBe('example-before');
    });

    it('exports AFTER_TEMPLATE', () => {
      expect(AFTER_TEMPLATE).toBeDefined();
      expect(AFTER_TEMPLATE.id).toBe('example-after');
    });
  });

  describe('BUILT_IN_TEMPLATES registration', () => {
    it('includes BEFORE_TEMPLATE', () => {
      expect(BUILT_IN_TEMPLATES.find(t => t.id === 'example-before')).toBeDefined();
    });

    it('includes AFTER_TEMPLATE', () => {
      expect(BUILT_IN_TEMPLATES.find(t => t.id === 'example-after')).toBeDefined();
    });
  });

  describe('AFTER_TEMPLATE hierarchy', () => {
    const getSlotStyle = (template: typeof AFTER_TEMPLATE, type: string) =>
      template.slots.find(s => s.type === type)!.style;

    it('headline fontSize > subhead fontSize > cta fontSize', () => {
      const headline = getSlotStyle(AFTER_TEMPLATE, 'headline').fontSize!;
      const subhead = getSlotStyle(AFTER_TEMPLATE, 'subhead').fontSize!;
      const cta = getSlotStyle(AFTER_TEMPLATE, 'cta').fontSize!;

      expect(headline).toBeGreaterThan(subhead);
      expect(subhead).toBeGreaterThan(cta);
    });

    it('headline has heavier font weight than subhead', () => {
      const headline = parseInt(getSlotStyle(AFTER_TEMPLATE, 'headline').fontWeight!);
      const subhead = parseInt(getSlotStyle(AFTER_TEMPLATE, 'subhead').fontWeight!);
      expect(headline).toBeGreaterThan(subhead);
    });
  });

  describe('BEFORE_TEMPLATE flat sizing', () => {
    it('all text slots have the same fontSize', () => {
      const textSlots = BEFORE_TEMPLATE.slots.filter(s => ['headline', 'subhead', 'cta'].includes(s.type));
      const sizes = textSlots.map(s => s.style.fontSize);
      expect(new Set(sizes).size).toBe(1);
    });

    it('all text slots have the same fontWeight', () => {
      const textSlots = BEFORE_TEMPLATE.slots.filter(s => ['headline', 'subhead', 'cta'].includes(s.type));
      const weights = textSlots.map(s => s.style.fontWeight);
      expect(new Set(weights).size).toBe(1);
    });
  });

  describe('AFTER_TEMPLATE safe zone compliance', () => {
    for (const fmt of FORMATS) {
      it(`all text within safe zones for ${fmt.id}`, () => {
        const safe = getSafeZonePixels(fmt.id, fmt.width, fmt.height).titleSafe;
        const mapped = mapTemplateToFormat(AFTER_TEMPLATE, fmt.id);
        const textSlots = mapped.filter(s => ['headline', 'subhead', 'cta'].includes(s.type));

        for (const slot of textSlots) {
          expect(slot.position.x).toBeGreaterThanOrEqual(safe.left);
          expect(slot.position.y).toBeGreaterThanOrEqual(safe.top);
          expect(slot.position.x + slot.position.width).toBeLessThanOrEqual(fmt.width - safe.right);
          expect(slot.position.y + slot.position.height).toBeLessThanOrEqual(fmt.height - safe.bottom);
        }
      });
    }
  });

  describe('BEFORE_TEMPLATE safe zone violations', () => {
    it('has at least one text element outside safe zones', () => {
      let violations = 0;
      for (const fmt of FORMATS) {
        const safe = getSafeZonePixels(fmt.id, fmt.width, fmt.height).titleSafe;
        const mapped = mapTemplateToFormat(BEFORE_TEMPLATE, fmt.id);
        const textSlots = mapped.filter(s => ['headline', 'subhead', 'cta'].includes(s.type));

        for (const slot of textSlots) {
          if (
            slot.position.x < safe.left ||
            slot.position.y < safe.top ||
            slot.position.x + slot.position.width > fmt.width - safe.right ||
            slot.position.y + slot.position.height > fmt.height - safe.bottom
          ) {
            violations++;
          }
        }
      }
      expect(violations).toBeGreaterThan(0);
    });
  });

  describe('both templates have same slot structure', () => {
    it('same number of slots', () => {
      expect(BEFORE_TEMPLATE.slots.length).toBe(AFTER_TEMPLATE.slots.length);
    });

    it('same slot types in same order', () => {
      const beforeTypes = BEFORE_TEMPLATE.slots.map(s => s.type);
      const afterTypes = AFTER_TEMPLATE.slots.map(s => s.type);
      expect(beforeTypes).toEqual(afterTypes);
    });

    it('both support all 3 formats', () => {
      for (const fmt of FORMATS) {
        expect(() => mapTemplateToFormat(BEFORE_TEMPLATE, fmt.id)).not.toThrow();
        expect(() => mapTemplateToFormat(AFTER_TEMPLATE, fmt.id)).not.toThrow();
      }
    });
  });
});
