import { Router } from 'express';
export interface GenerateImageRequest {
    prompt: string;
    width?: number;
    height?: number;
}
export interface ImageClient {
    generateImage(prompt: string, width: number, height: number): Promise<string>;
}
export declare class NanoBananaClient implements ImageClient {
    private apiKey;
    constructor(apiKey: string);
    generateImage(prompt: string, width: number, height: number): Promise<string>;
}
export declare function createGenerateImageRouter(client?: ImageClient): Router;
