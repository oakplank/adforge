import { describe, it, expect } from 'vitest';
import { detectCategory, getFormatConfig, generateTextSafeZoneInstructions, generateEnhancedPrompt, enhanceImagePrompt, FORMAT_CONFIGS, CATEGORY_CONFIGS, } from './promptEngine.js';
describe('detectCategory', () => {
    it('detects food category', () => {
        expect(detectCategory('pizza', 'delicious pizza deal')).toBe('food');
        expect(detectCategory('coffee', 'morning coffee sale')).toBe('food');
        expect(detectCategory('burger', 'juicy burger promo')).toBe('food');
    });
    it('detects fashion category', () => {
        expect(detectCategory('dress', 'summer dress collection')).toBe('fashion');
        expect(detectCategory('sneakers', 'new sneakers drop')).toBe('fashion');
        expect(detectCategory('jacket', 'leather jacket sale')).toBe('fashion');
    });
    it('detects tech category', () => {
        expect(detectCategory('laptop', 'new laptop deal')).toBe('tech');
        expect(detectCategory('headphones', 'wireless headphones')).toBe('tech');
        expect(detectCategory('phone', 'smartphone sale')).toBe('tech');
    });
    it('detects beauty category', () => {
        expect(detectCategory('lipstick', 'new lipstick shade')).toBe('beauty');
        expect(detectCategory('skincare', 'skincare routine')).toBe('beauty');
        expect(detectCategory('perfume', 'luxury perfume')).toBe('beauty');
    });
    it('detects fitness category', () => {
        expect(detectCategory('workout', 'workout gear')).toBe('fitness');
        expect(detectCategory('gym', 'gym membership')).toBe('fitness');
        expect(detectCategory('protein', 'protein powder')).toBe('fitness');
    });
    it('returns general for unknown products', () => {
        expect(detectCategory('widget', 'amazing widget')).toBe('general');
        expect(detectCategory('thing', 'cool thing')).toBe('general');
    });
});
describe('getFormatConfig', () => {
    it('returns square config for square format', () => {
        const config = getFormatConfig('square');
        expect(config.aspectRatio).toBe('1:1');
        expect(config.width).toBe(1080);
        expect(config.height).toBe(1080);
    });
    it('returns portrait config for portrait format', () => {
        const config = getFormatConfig('portrait');
        expect(config.aspectRatio).toBe('4:5');
        expect(config.width).toBe(1080);
        expect(config.height).toBe(1350);
    });
    it('returns story config for story format', () => {
        const config = getFormatConfig('story');
        expect(config.aspectRatio).toBe('9:16');
        expect(config.width).toBe(1080);
        expect(config.height).toBe(1920);
    });
    it('returns story config for 9:16 format', () => {
        const config = getFormatConfig('9:16');
        expect(config.aspectRatio).toBe('9:16');
    });
    it('defaults to square for unknown formats', () => {
        const config = getFormatConfig('unknown');
        expect(config.aspectRatio).toBe('1:1');
    });
});
describe('generateTextSafeZoneInstructions', () => {
    it('includes top and bottom percentages', () => {
        const config = FORMAT_CONFIGS.square;
        const instructions = generateTextSafeZoneInstructions(config);
        expect(instructions).toContain('top');
        expect(instructions).toContain('bottom');
        expect(instructions).toContain('clean');
        expect(instructions).toContain('text overlay');
    });
    it('uses correct percentages for each format', () => {
        const squareInstructions = generateTextSafeZoneInstructions(FORMAT_CONFIGS.square);
        const storyInstructions = generateTextSafeZoneInstructions(FORMAT_CONFIGS.story);
        // Story has different safe zones than square
        expect(squareInstructions).not.toBe(storyInstructions);
    });
});
describe('generateEnhancedPrompt', () => {
    it('includes photography style for category', () => {
        const result = generateEnhancedPrompt('pizza', 'delicious pizza', 'warm', 'square');
        expect(result.prompt.toLowerCase()).toContain('food photography');
        expect(result.category).toBe('food');
    });
    it('includes format-specific composition', () => {
        const squareResult = generateEnhancedPrompt('product', 'cool product', 'energetic', 'square');
        const storyResult = generateEnhancedPrompt('product', 'cool product', 'energetic', 'story');
        expect(squareResult.formatConfig.aspectRatio).toBe('1:1');
        expect(storyResult.formatConfig.aspectRatio).toBe('9:16');
    });
    it('includes text safe zone instructions', () => {
        const result = generateEnhancedPrompt('shoes', 'cool shoes', 'energetic', 'square');
        expect(result.textSafeZoneInstructions).toContain('clean');
        expect(result.textSafeZoneInstructions).toContain('text overlay');
    });
    it('includes professional quality keywords', () => {
        const result = generateEnhancedPrompt('watch', 'luxury watch', 'luxury', 'portrait');
        expect(result.prompt.toLowerCase()).toContain('professional');
        expect(result.prompt.toLowerCase()).toContain('quality');
    });
    it('handles color input', () => {
        const result = generateEnhancedPrompt('sneakers', 'cool sneakers', 'energetic', 'square', ['#FF6B00', '#1565C0']);
        expect(result.prompt).toContain('#FF6B00');
    });
});
describe('enhanceImagePrompt', () => {
    it('returns complete enhanced prompt output', () => {
        const result = enhanceImagePrompt({
            product: 'coffee',
            category: 'food',
            vibe: 'warm',
            format: 'square',
        });
        expect(result.prompt).toBeTruthy();
        expect(result.category).toBe('food');
        expect(result.formatConfig).toBeDefined();
        expect(result.textSafeZoneInstructions).toBeDefined();
        expect(result.photographyDirections).toBeDefined();
    });
    it('includes lighting directions', () => {
        const result = enhanceImagePrompt({
            product: 'laptop',
            category: 'tech',
            vibe: 'minimal',
            format: 'square',
        });
        expect(result.photographyDirections.toLowerCase()).toContain('lighting');
    });
    it('includes depth of field', () => {
        const result = enhanceImagePrompt({
            product: 'necklace',
            category: 'jewelry',
            vibe: 'luxury',
            format: 'portrait',
        });
        expect(result.prompt.toLowerCase()).toContain('depth of field');
    });
});
describe('FORMAT_CONFIGS', () => {
    it('has all required formats', () => {
        expect(FORMAT_CONFIGS.square).toBeDefined();
        expect(FORMAT_CONFIGS.portrait).toBeDefined();
        expect(FORMAT_CONFIGS.story).toBeDefined();
    });
    it('has safe zone values for each format', () => {
        for (const format of Object.values(FORMAT_CONFIGS)) {
            expect(format.safeZoneTop).toBeGreaterThan(0);
            expect(format.safeZoneBottom).toBeGreaterThan(0);
        }
    });
});
describe('CATEGORY_CONFIGS', () => {
    it('has all required categories', () => {
        const requiredCategories = ['food', 'fashion', 'tech', 'beauty', 'fitness', 'travel', 'home', 'automotive', 'jewelry', 'general'];
        for (const category of requiredCategories) {
            expect(CATEGORY_CONFIGS[category]).toBeDefined();
        }
    });
    it('has photography style for each category', () => {
        for (const config of Object.values(CATEGORY_CONFIGS)) {
            expect(config.photographyStyle).toBeTruthy();
            expect(config.lightingStyle).toBeTruthy();
            expect(config.backgroundStyle).toBeTruthy();
        }
    });
});
