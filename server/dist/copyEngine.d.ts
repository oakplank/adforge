export type HeadlineFormula = 'urgency' | 'benefit' | 'question' | 'announcement' | 'number' | 'curiosity';
export interface CopyInput {
    product: string;
    offer?: string;
    vibe: string;
    category: string;
}
export interface CopyOutput {
    headline: string;
    subhead: string;
    cta: string;
    formula: HeadlineFormula;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare const CHAR_LIMITS: {
    readonly headline: 30;
    readonly subhead: 60;
    readonly cta: 15;
};
export declare function generateCopy(input: CopyInput): CopyOutput;
export declare const generateAdCopy: typeof generateCopy;
export declare function validateCopy(copy: CopyOutput): ValidationResult;
