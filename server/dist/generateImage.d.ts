import { Router } from 'express';
export declare class NanoBananaClient {
    private apiKey;
    constructor(apiKey: string);
    generateImage(prompt: string, width: number, height: number, enhancedPrompt?: string): Promise<string>;
}
export declare function createGenerateImageRouter(client?: NanoBananaClient): Router;
