/**
 * Copy Engine - Generates better ad copy using proven copywriting formulas
 *
 * Features:
 * - Headline formulas based on proven patterns (urgency, benefit-led, question, social proof, number)
 * - Context-aware formula selection
 * - Subhead that complements (not repeats) headline
 * - Action-specific CTA text
 * - Character limit enforcement (IG best practices)
 */
import { ProductCategory } from './promptEngine.js';
export declare const CHAR_LIMITS: {
    readonly headline: 30;
    readonly subhead: 60;
    readonly cta: 15;
};
export type HeadlineFormula = 'urgency' | 'benefit' | 'question' | 'social-proof' | 'number' | 'announcement' | 'curiosity';
export interface CopyInput {
    product: string;
    offer?: string;
    vibe: string;
    category: ProductCategory;
    intent?: 'purchase' | 'sign-up' | 'download' | 'learn' | 'visit' | 'book';
}
export interface CopyOutput {
    headline: string;
    subhead: string;
    cta: string;
    formula: HeadlineFormula;
}
/**
 * Main entry point for copy generation
 */
export declare function generateCopy(input: CopyInput): CopyOutput;
/**
 * Validate copy against character limits
 */
export declare function validateCopy(copy: CopyOutput): {
    valid: boolean;
    errors: string[];
};
