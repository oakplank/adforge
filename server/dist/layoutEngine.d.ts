/**
 * Layout Engine - Intelligent layout calculation with design rules
 *
 * Features:
 * - Z-pattern and F-pattern reading flow awareness
 * - WCAG AA contrast checking (4.5:1 ratio)
 * - Dynamic font sizing based on text length
 * - Safe zone enforcement per format
 * - Logo placement rules (top-right or bottom-right, never center)
 * - CTA placement (lower third, centered or right-aligned)
 * - Visual weight balancing
 */
import { AdFormat } from './promptEngine.js';
export declare const WCAG_AA_RATIO = 4.5;
export interface SafeZone {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export declare const SAFE_ZONES: Record<AdFormat, SafeZone>;
export interface FontSizeConfig {
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
}
export declare const FONT_SIZES: FontSizeConfig;
export interface Position {
    x: number;
    y: number;
}
export interface ElementLayout {
    position: Position;
    fontSize: number;
    width: number;
    height: number;
    alignment: 'left' | 'center' | 'right';
}
export interface LayoutOutput {
    format: AdFormat;
    width: number;
    height: number;
    safeZone: SafeZone;
    headline: ElementLayout;
    subhead: ElementLayout;
    cta: ElementLayout;
    logoPosition: Position;
    textColors: {
        headline: string;
        subhead: string;
        cta: string;
        ctaBackground: string;
    };
    contrastRatios: {
        headline: number;
        subhead: number;
        cta: number;
    };
    readingPattern: 'z-pattern' | 'f-pattern';
}
export type ReadingPattern = 'z-pattern' | 'f-pattern';
/**
 * Calculate contrast ratio between two colors
 * WCAG 2.0 formula
 */
export declare function calculateContrastRatio(color1: string, color2: string): number;
/**
 * Check if contrast ratio meets WCAG AA
 */
export declare function meetsContrastRequirement(color1: string, color2: string): boolean;
/**
 * Find a text color that meets contrast requirements against a background
 */
export declare function findAccessibleTextColor(backgroundColor: string, preferredColor?: string): {
    color: string;
    ratio: number;
};
/**
 * Calculate dynamic font size based on text length
 */
export declare function calculateFontSize(text: string, config: {
    min: number;
    max: number;
    default: number;
}, maxWidth: number): number;
/**
 * Generate complete layout for an ad
 */
export declare function generateLayout(format: string, headline: string, subhead: string, cta: string, backgroundColor: string, accentColor: string, hasVisualElement?: boolean): LayoutOutput;
/**
 * Validate layout meets all requirements
 */
export declare function validateLayout(layout: LayoutOutput): {
    valid: boolean;
    warnings: string[];
};
/**
 * Adjust layout for visual weight balancing
 * If product image is on one side, offset text to the other
 */
export declare function balanceVisualWeight(layout: LayoutOutput, productImagePosition: 'left' | 'center' | 'right'): LayoutOutput;
