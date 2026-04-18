import { useState } from 'react';
import {
  generateAd as apiGenerateAd,
  generateImage as apiGenerateImage,
  saveGeneration,
  type GenerateImageRequest,
} from '../api/client';
import {
  analyzeImageForPlacement,
  type PlacementHints,
  type PlacementPlan,
} from '../utils/imagePlacementAnalyzer';

interface FormatConfig {
  id: string;
  aspectRatio: string;
  width: number;
  height: number;
  safeZoneTop: number;
  safeZoneBottom: number;
  composition: string;
}

interface PromptPipeline {
  rawPrompt: string;
  baseCreativeBrief: string;
  renderPrompt: string;
  systemPrompt: string;
  styleProfileId: string;
  styleProfileName: string;
  qualityChecklist: string[];
}

interface PlacementPlanHints {
  preferredAlignment?: 'left' | 'center' | 'right' | 'auto';
  preferredHeadlineBand?: 'top' | 'upper';
  avoidCenter?: boolean;
  ctaPriority?: 'high' | 'medium' | 'low';
}

interface AgenticPlan {
  preflightChecklist: string[];
  postImageChecklist: string[];
  placementHypothesis: string;
  copyStrategy: string;
}

export interface AdSpec {
  imagePrompt: string;
  texts: { headline: string; subhead: string; cta: string };
  colors: { primary: string; secondary: string; accent: string; text: string; background: string };
  templateId: string;
  category?: string;
  metadata?: {
    objective?: 'offer' | 'launch' | 'awareness';
    formatConfig?: FormatConfig;
    promptPipeline?: PromptPipeline;
    placementHints?: PlacementPlanHints;
    placementPlan?: PlacementPlan;
    agenticPlan?: AgenticPlan;
    model?: {
      provider: 'google';
      name: string;
    };
    copyVariantIndex?: number;
    textTreatmentHintId?: string;
  };
}

export interface GenerationResult {
  adSpec: AdSpec;
  imageUrl?: string;
  imageBase64?: string;
}

export interface UseGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  result: GenerationResult | null;
  generate: (prompt: string, format: string, templateId?: string) => Promise<GenerationResult | null>;
}

const FORMAT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

async function analyzeWithTimeout(source: string, hints: PlacementHints, timeoutMs = 1200): Promise<PlacementPlan | null> {
  return new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    analyzeImageForPlacement(source, hints)
      .then((plan) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(plan);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(null);
      });
  });
}

function toPlacementHints(adSpec: AdSpec, format: string): PlacementHints {
  const metadata = adSpec.metadata;

  return {
    formatId: (format as PlacementHints['formatId']) || 'square',
    objective: metadata?.objective,
    preferredAlignment: metadata?.placementHints?.preferredAlignment || 'auto',
    preferredHeadlineBand: metadata?.placementHints?.preferredHeadlineBand || 'top',
    avoidCenter: metadata?.placementHints?.avoidCenter ?? false,
    accentColor: adSpec.colors.accent,
    backgroundColor: adSpec.colors.background,
  };
}

export function useGeneration(): UseGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  async function generate(prompt: string, format: string, templateId?: string): Promise<GenerationResult | null> {
    setError(null);
    setIsGenerating(true);

    try {
      // Step 1: Generate ad spec via API client
      const adSpec = await apiGenerateAd(prompt, format, templateId) as unknown as AdSpec;
      const fallbackDims = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.square;
      const width = adSpec.metadata?.formatConfig?.width || fallbackDims.width;
      const height = adSpec.metadata?.formatConfig?.height || fallbackDims.height;

      // Step 2: Build image generation request
      const promptPipeline = adSpec.metadata?.promptPipeline;
      const imageBody: GenerateImageRequest = {
        prompt: adSpec.imagePrompt,
        width,
        height,
        qualityGate: true,
      };

      if (promptPipeline?.renderPrompt) {
        imageBody.enhancedPrompt = promptPipeline.renderPrompt;
      }
      if (promptPipeline?.systemPrompt) {
        imageBody.systemPrompt = promptPipeline.systemPrompt;
      }
      if (adSpec.metadata?.model?.name) {
        imageBody.model = adSpec.metadata.model.name;
      }

      // Step 3: Generate image via API client
      const imgData = await apiGenerateImage(imageBody);
      const imageSrc = imgData.imageBase64 ? `data:image/png;base64,${imgData.imageBase64}` : imgData.imageUrl;

      // Step 4: Analyze image placement if base64
      if (imageSrc && imageSrc.startsWith('data:')) {
        const placementPlan = await analyzeWithTimeout(imageSrc, toPlacementHints(adSpec, format));
        if (placementPlan) {
          adSpec.metadata = {
            ...adSpec.metadata,
            placementPlan,
          };
        }
      }

      const genResult: GenerationResult = {
        adSpec,
        imageUrl: imgData.imageUrl,
        imageBase64: imgData.imageBase64,
      };

      setResult(genResult);

      // Step 5: Persist generation history (non-blocking)
      try {
        await saveGeneration({
          prompt: prompt.trim(),
          format,
          width,
          height,
          imagePrompt: adSpec.imagePrompt,
          enhancedPrompt: adSpec.metadata?.promptPipeline?.renderPrompt,
          systemPrompt: adSpec.metadata?.promptPipeline?.systemPrompt,
          model: adSpec.metadata?.model?.name,
          adSpec,
          imageBase64: imgData.imageBase64,
          imageUrl: imgData.imageUrl,
          mimeType: imgData.mimeType,
        });
      } catch {
        // Non-blocking: generation is still valid if history persistence fails.
      }

      return genResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }

  return { isGenerating, error, result, generate };
}
