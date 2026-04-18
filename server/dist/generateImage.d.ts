import { Router } from 'express';
interface ImageQualityReport {
    approved: boolean;
    score: number;
    issues: string[];
    correctionPrompt: string;
}
export declare class NanoBananaClient {
    private apiKey;
    constructor(apiKey: string);
    private sanitizeModel;
    private sanitizeQaModel;
    private normalizeQualityReport;
    private extractJsonObject;
    private inferQualityFromTextResponse;
    private reviewImageQuality;
    /**
     * Truncate a prompt to approximately maxWords words, preserving sentence boundaries
     * where possible. Strips metadata-like lines (audience:, format:, brand:, etc.).
     */
    private truncatePrompt;
    generateImage(prompt: string, width: number, height: number, enhancedPrompt?: string, systemPrompt?: string, model?: string): Promise<string>;
    generateImageWithQualityGate(input: {
        prompt: string;
        width: number;
        height: number;
        enhancedPrompt?: string;
        systemPrompt?: string;
        model?: string;
        qualityGate?: boolean;
    }): Promise<{
        image: string;
        model: string;
        attempts: number;
        reports: ImageQualityReport[];
    }>;
}
export declare function createGenerateImageRouter(client?: NanoBananaClient): Router;
export {};
