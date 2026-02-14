import { Router } from 'express';
import { type FormatConfig } from './promptEngine.js';
import { type LayoutOutput } from './layoutEngine.js';
declare const VIBE_COLOR_MAP: Record<string, {
    primary: string;
    secondary: string;
    accent: string;
}>;
declare const COLOR_NAME_MAP: Record<string, string>;
export interface AdTexts {
    headline: string;
    subhead: string;
    cta: string;
}
export interface AdColors {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
}
export interface AdSpec {
    imagePrompt: string;
    texts: AdTexts;
    colors: AdColors;
    templateId: string;
    category: string;
    layout?: LayoutOutput;
    metadata?: {
        headlineFormula: string;
        contrastRatios: {
            headline: number;
            subhead: number;
            cta: number;
        };
        formatConfig: FormatConfig;
    };
}
interface ParsedPrompt {
    product: string;
    offer: string;
    vibe: string;
    colors: string[];
    rawPrompt: string;
}
export declare function parsePrompt(prompt: string): ParsedPrompt;
export declare function generateAdSpec(parsed: ParsedPrompt, format?: string, templateId?: string): AdSpec;
export declare function createGenerateAdRouter(): Router;
export { VIBE_COLOR_MAP, COLOR_NAME_MAP };
