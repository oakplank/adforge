import { describe, it, expect } from 'vitest';
import { generateCopy, validateCopy, CHAR_LIMITS, } from './copyEngine.js';
describe('generateCopy', () => {
    it('generates urgency headline for offers', () => {
        const result = generateCopy({
            product: 'shoes',
            offer: '30% off',
            vibe: 'energetic',
            category: 'fashion',
        });
        expect(result.formula).toBe('urgency');
        expect(result.headline.toLowerCase()).toContain('30% off');
    });
    it('generates benefit headline for non-offer products', () => {
        const result = generateCopy({
            product: 'leather bags',
            vibe: 'luxury',
            category: 'fashion',
        });
        // Should use benefit or announcement formula
        expect(['benefit', 'announcement', 'curiosity']).toContain(result.formula);
        expect(result.headline).toBeTruthy();
    });
    it('generates Shop Now CTA for offers', () => {
        const result = generateCopy({
            product: 'sneakers',
            offer: '20% off',
            vibe: 'energetic',
            category: 'fashion',
        });
        expect(result.cta).toBe('Shop Now');
    });
    it('generates category-appropriate CTA for food', () => {
        const result = generateCopy({
            product: 'pizza',
            vibe: 'warm',
            category: 'food',
        });
        // Food typically gets Order Now or Shop Now
        expect(['Order Now', 'Shop Now']).toContain(result.cta);
    });
    it('generates Book Now CTA for travel', () => {
        const result = generateCopy({
            product: 'vacation package',
            vibe: 'adventurous',
            category: 'travel',
        });
        expect(result.cta).toBe('Book Now');
    });
    it('generates subhead that differs from headline', () => {
        const result = generateCopy({
            product: 'laptop',
            offer: '15% off',
            vibe: 'minimal',
            category: 'tech',
        });
        expect(result.subhead).not.toBe(result.headline);
        expect(result.subhead.length).toBeGreaterThan(0);
    });
    it('respects headline character limit', () => {
        const result = generateCopy({
            product: 'super deluxe premium ultra wireless noise-cancelling headphones',
            vibe: 'minimal',
            category: 'tech',
        });
        expect(result.headline.length).toBeLessThanOrEqual(CHAR_LIMITS.headline);
    });
    it('respects subhead character limit', () => {
        const result = generateCopy({
            product: 'amazing product',
            vibe: 'energetic',
            category: 'general',
        });
        expect(result.subhead.length).toBeLessThanOrEqual(CHAR_LIMITS.subhead);
    });
    it('respects CTA character limit', () => {
        const result = generateCopy({
            product: 'product',
            vibe: 'energetic',
            category: 'general',
        });
        expect(result.cta.length).toBeLessThanOrEqual(CHAR_LIMITS.cta);
    });
    it('uses number formula for fitness category', () => {
        const result = generateCopy({
            product: 'workout program',
            vibe: 'energetic',
            category: 'fitness',
        });
        expect(result.formula).toBe('number');
    });
    it('uses question formula for travel category', () => {
        const result = generateCopy({
            product: 'beach resort',
            vibe: 'calm',
            category: 'travel',
        });
        expect(result.formula).toBe('question');
    });
});
describe('validateCopy', () => {
    it('returns valid for proper copy', () => {
        const copy = {
            headline: 'Short Headline',
            subhead: 'A slightly longer subhead that fits',
            cta: 'Shop Now',
            formula: 'benefit',
        };
        const result = validateCopy(copy);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('returns error for too-long headline', () => {
        const copy = {
            headline: 'This is a very long headline that definitely exceeds the character limit',
            subhead: 'Normal subhead',
            cta: 'Shop',
            formula: 'benefit',
        };
        const result = validateCopy(copy);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Headline'))).toBe(true);
    });
    it('returns error for too-long subhead', () => {
        const copy = {
            headline: 'Normal',
            subhead: 'This is an incredibly long subhead that goes on and on and exceeds the character limit for Instagram ad copy',
            cta: 'Shop',
            formula: 'benefit',
        };
        const result = validateCopy(copy);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Subhead'))).toBe(true);
    });
    it('returns error for too-long CTA', () => {
        const copy = {
            headline: 'Normal',
            subhead: 'Normal subhead',
            cta: 'This CTA is way too long',
            formula: 'benefit',
        };
        const result = validateCopy(copy);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('CTA'))).toBe(true);
    });
});
describe('CHAR_LIMITS', () => {
    it('has correct Instagram best practice limits', () => {
        expect(CHAR_LIMITS.headline).toBe(30);
        expect(CHAR_LIMITS.subhead).toBe(60);
        expect(CHAR_LIMITS.cta).toBe(15);
    });
});
