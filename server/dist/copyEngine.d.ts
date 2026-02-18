import type { AdIntent } from './types/textSystem.js';
export type HeadlineFormula = 'urgency' | 'benefit' | 'question' | 'announcement' | 'number' | 'curiosity' | 'proof';
type Objective = 'offer' | 'launch' | 'awareness';
type CtaPriority = 'high' | 'medium' | 'low';
export interface CopyPlanningLayer {
    targetAudience?: string;
    narrativeMoment?: string;
    copyStrategy?: string;
    emotionalTone?: string;
    keyPhrases?: string[];
    brandName?: string;
    ctaPriority?: CtaPriority;
}
export interface CopyInput {
    product: string;
    offer?: string;
    vibe: string;
    category: string;
    objective?: Objective;
    rawPrompt?: string;
    variantOffset?: number;
    planning?: CopyPlanningLayer;
    intent?: AdIntent;
}
export interface CopyOutput {
    headline: string;
    subhead: string;
    cta: string;
    formula: HeadlineFormula;
    planningDriven?: boolean;
    planningRationale?: string[];
    brandMention?: {
        mode: 'none' | 'cta' | 'subhead' | 'headline';
        value?: string;
        subtle: boolean;
    };
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare const CHAR_LIMITS: {
    readonly headline: 34;
    readonly subhead: 62;
    readonly cta: 16;
};
export declare const RETARGETING_CTA_CANDIDATES: string[];
export declare function generateCopy(input: CopyInput): CopyOutput;
export declare const generateAdCopy: typeof generateCopy;
export declare function validateCopy(copy: CopyOutput): ValidationResult;
export {};
