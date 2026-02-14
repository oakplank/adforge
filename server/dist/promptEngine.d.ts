export interface FormatConfig {
    aspectRatio: string;
    width: number;
    height: number;
    safeZoneTop: number;
    safeZoneBottom: number;
    composition: string;
}
export interface CategoryConfig {
    photographyStyle: string;
    lightingStyle: string;
    backgroundStyle: string;
    colorPalette: string;
    depthOfField: string;
}
export declare const FORMAT_CONFIGS: Record<string, FormatConfig>;
export declare const CATEGORY_CONFIGS: Record<string, CategoryConfig>;
export declare function detectCategory(product: string, description: string): string;
export declare function getFormatConfig(format: string): FormatConfig;
export declare function generateTextSafeZoneInstructions(config: FormatConfig): string;
export declare function generateEnhancedPrompt(product: string, description: string, vibe: string, format: string, colors?: string[]): {
    prompt: string;
    category: string;
    formatConfig: FormatConfig;
    textSafeZoneInstructions: string;
};
export declare function enhanceImagePrompt(options: {
    product: string;
    category: string;
    vibe: string;
    format: string;
    colors?: string[];
}): {
    prompt: string;
    category: string;
    formatConfig: FormatConfig;
    textSafeZoneInstructions: string;
    photographyDirections: string;
};
