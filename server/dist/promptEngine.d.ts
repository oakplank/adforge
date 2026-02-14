/**
 * Prompt Engine - Transforms simple user prompts into design-aware, professional image prompts
 *
 * Applies:
 * - Ad format awareness (square, portrait, story)
 * - Design principles (rule of thirds, visual hierarchy, breathing room)
 * - Product category detection with category-specific photography styles
 * - Text-safe zones for overlay areas
 * - Professional photography direction (lighting, depth of field, background)
 */
export type AdFormat = 'square' | 'portrait' | 'story';
export interface FormatConfig {
    aspectRatio: string;
    width: number;
    height: number;
    composition: string;
    safeZoneTop: number;
    safeZoneBottom: number;
    productPlacement: string;
}
export declare const FORMAT_CONFIGS: Record<AdFormat, FormatConfig>;
export type ProductCategory = 'food' | 'fashion' | 'tech' | 'beauty' | 'fitness' | 'travel' | 'home' | 'automotive' | 'jewelry' | 'general';
export interface CategoryConfig {
    keywords: string[];
    photographyStyle: string;
    lightingStyle: string;
    backgroundStyle: string;
    angle: string;
    colorScheme: string;
    props: string[];
}
export declare const CATEGORY_CONFIGS: Record<ProductCategory, CategoryConfig>;
export interface ColorPsychology {
    mood: string;
    primaryHues: string[];
    accentHues: string[];
    avoidColors: string[];
}
export declare const COLOR_PSYCHOLOGY: Record<ProductCategory, ColorPsychology>;
export interface EnhancedPromptInput {
    product: string;
    category: ProductCategory;
    vibe: string;
    format: AdFormat;
    offer?: string;
    colors?: string[];
}
export interface EnhancedPromptOutput {
    prompt: string;
    category: ProductCategory;
    formatConfig: FormatConfig;
    textSafeZoneInstructions: string;
    photographyDirections: string;
}
/**
 * Detect product category from the product description and keywords
 */
export declare function detectCategory(product: string, rawPrompt: string): ProductCategory;
/**
 * Get format configuration
 */
export declare function getFormatConfig(format: string): FormatConfig;
/**
 * Generate text-safe zone instructions for the image prompt
 */
export declare function generateTextSafeZoneInstructions(formatConfig: FormatConfig): string;
/**
 * Generate rule of thirds placement instructions
 */
export declare function generatePlacementInstructions(format: AdFormat): string;
/**
 * Generate professional photography direction
 */
export declare function generatePhotographyDirections(category: ProductCategory, vibe: string, formatConfig: FormatConfig): string;
/**
 * Generate the enhanced image prompt
 */
export declare function enhanceImagePrompt(input: EnhancedPromptInput): EnhancedPromptOutput;
/**
 * Main entry point for prompt engine
 */
export declare function generateEnhancedPrompt(product: string, rawPrompt: string, vibe: string, format: string, colors?: string[]): EnhancedPromptOutput;
