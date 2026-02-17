import { Router } from 'express';
import { type FormatConfig, type Objective, type PromptPipeline, type PlacementPlanHints, type AgenticPlan } from './promptEngine.js';
import { type LayoutOutput } from './layoutEngine.js';
import { type WebsiteBrandKit } from './websiteBrandKit.js';
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
        objective: Objective;
        promptPipeline: PromptPipeline;
        placementHints: PlacementPlanHints;
        agenticPlan: AgenticPlan;
        model: {
            provider: 'google';
            name: string;
        };
        headlineFormula: string;
        brandMentionMode?: 'none' | 'cta' | 'subhead' | 'headline';
        brandMentionValue?: string;
        brandKit?: {
            sourceUrl: string;
            domain: string;
            brandName: string;
            logoUrl?: string;
            palette: string[];
            contextSummary: string;
            keyPhrases: string[];
            businessType?: string;
            targetAudience?: string;
            offerings?: string[];
        };
        contrastRatios: {
            headline: number;
            subhead: number;
            cta: number;
        };
        formatConfig: FormatConfig;
        copyVariantIndex: number;
        textTreatmentHintId: string;
        copyPlan?: {
            planningDriven: boolean;
            rationale: string[];
            strategy: string;
        };
    };
}
interface ParsedPrompt {
    product: string;
    offer: string;
    vibe: string;
    colors: string[];
    rawPrompt: string;
    websiteUrl?: string;
}
export declare function parsePrompt(prompt: string): ParsedPrompt;
export declare function generateAdSpec(parsed: ParsedPrompt, format?: string, templateId?: string, variantOffset?: number, brandKit?: WebsiteBrandKit): AdSpec;
export declare function createGenerateAdRouter(): Router;
export { VIBE_COLOR_MAP, COLOR_NAME_MAP };
