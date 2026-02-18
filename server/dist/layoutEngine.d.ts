import type { AdIntent } from './types/textSystem.js';
export declare const WCAG_AA_RATIO = 4.5;
/** @deprecated Use SAFE_ZONE_SPECS from designTokens instead */
export declare const SAFE_ZONES: {
    square: {
        top: number;
        bottom: number;
    };
    portrait: {
        top: number;
        bottom: number;
    };
    story: {
        top: number;
        bottom: number;
    };
};
/** @deprecated Use TYPOGRAPHY_SCALE from designTokens instead */
export declare const FONT_SIZES: {
    headline: {
        min: number;
        max: number;
        default: number;
    };
    subhead: {
        min: number;
        max: number;
        default: number;
    };
    cta: {
        min: number;
        max: number;
        default: number;
    };
};
interface FontSizeConfig {
    min: number;
    max: number;
    default: number;
}
interface Position {
    x: number;
    y: number;
}
interface TextElement {
    text: string;
    position: Position;
    fontSize: number;
    color: string;
    width: number;
    height: number;
}
export interface LayoutOutput {
    format: string;
    width: number;
    height: number;
    headline: TextElement;
    subhead: TextElement;
    cta: TextElement;
    logoPosition: Position;
    textColors: {
        headline: string;
        subhead: string;
        cta: string;
    };
    contrastRatios: {
        headline: number;
        subhead: number;
        cta: number;
    };
    readingPattern: string;
}
export declare function calculateContrastRatio(color1: string, color2: string): number;
export declare function meetsContrastRequirement(color1: string, color2: string): boolean;
export declare function findAccessibleTextColor(bgColor: string, preferred?: string): {
    color: string;
    ratio: number;
};
export declare function calculateFontSize(text: string, config: FontSizeConfig, containerWidth: number): number;
export declare function generateLayout(format: string, headline: string, subhead: string, ctaText: string, bgColor: string, accentColor: string, intent?: AdIntent): LayoutOutput;
export declare function validateLayout(layout: LayoutOutput): {
    valid: boolean;
    warnings: string[];
};
export declare function balanceVisualWeight(layout: LayoutOutput, imagePosition: 'left' | 'right' | 'center'): LayoutOutput;
export {};
