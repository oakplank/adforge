export type Objective = 'offer' | 'launch' | 'awareness';
export interface FormatConfig {
    aspectRatio: string;
    width: number;
    height: number;
    safeZoneTop: number;
    safeZoneBottom: number;
    composition: string;
}
export interface CategoryConfig {
    photographyStyle: string;
    lightingStyle: string;
    backgroundStyle: string;
    colorPalette: string;
    depthOfField: string;
}
export interface PromptPipeline {
    rawPrompt: string;
    baseCreativeBrief: string;
    renderPrompt: string;
    systemPrompt: string;
    styleProfileId: string;
    styleProfileName: string;
    qualityChecklist: string[];
    creativeInterpretation: {
        intent: string;
        visualPromise: string;
        sceneBrief: string;
        backgroundDirective: string;
        variationOptions: string[];
    };
    interpretiveLayer: {
        selectedDirection: string;
        cleanedIntent: string;
        ambiguityFlags: string[];
        refinedSceneInstruction: string;
        doNotInclude: string[];
    };
    thoughtSession: {
        targetAudience: string;
        decisionSummary: string;
        narrativeMoment: string;
        humanPresence: 'none' | 'hands_only' | 'partial_person' | 'full_person';
        realismLevel: string;
        realismCues: string[];
        subjectPriority: string;
        backgroundPriority: string;
        lightingApproach: string;
        compositionApproach: string;
        regenerationTriggers: string[];
    };
}
export interface PlacementPlanHints {
    preferredAlignment?: 'left' | 'center' | 'right' | 'auto';
    preferredHeadlineBand?: 'top' | 'upper';
    avoidCenter?: boolean;
    ctaPriority?: 'high' | 'medium' | 'low';
}
export interface AgenticPlan {
    preflightChecklist: string[];
    postImageChecklist: string[];
    placementHypothesis: string;
    copyStrategy: string;
}
export declare const FORMAT_CONFIGS: Record<string, FormatConfig>;
export declare const CATEGORY_CONFIGS: Record<string, CategoryConfig>;
export declare function detectObjective(description: string, offer?: string): Objective;
export declare function detectCategory(product: string, description: string): string;
export declare function getFormatConfig(format: string): FormatConfig;
export declare function generateTextSafeZoneInstructions(config: FormatConfig): string;
export declare function generateEnhancedPrompt(product: string, description: string, vibe: string, format: string, colors?: string[]): {
    prompt: string;
    category: string;
    formatConfig: FormatConfig;
    textSafeZoneInstructions: string;
};
export declare function buildPromptPipeline(options: {
    rawPrompt: string;
    product: string;
    description: string;
    vibe: string;
    format: string;
    colors?: string[];
    offer?: string;
    objective?: Objective;
}): {
    category: string;
    objective: Objective;
    formatConfig: FormatConfig;
    textSafeZoneInstructions: string;
    promptPipeline: PromptPipeline;
    placementHints: PlacementPlanHints;
    agenticPlan: AgenticPlan;
    suggestedTemplateId: string;
};
export declare function enhanceImagePrompt(options: {
    product: string;
    category: string;
    vibe: string;
    format: string;
    colors?: string[];
}): {
    prompt: string;
    category: string;
    formatConfig: FormatConfig;
    textSafeZoneInstructions: string;
    photographyDirections: string;
};
