import { useState } from 'react';
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

async function persistGenerationHistory(
  prompt: string,
  format: string,
  width: number,
  height: number,
  adSpec: AdSpec,
  imgData: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('/api/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        format,
        width,
        height,
        imagePrompt: adSpec.imagePrompt,
        enhancedPrompt: adSpec.metadata?.promptPipeline?.renderPrompt,
        systemPrompt: adSpec.metadata?.promptPipeline?.systemPrompt,
        model: adSpec.metadata?.model?.name,
        adSpec,
        imageBase64: typeof imgData.imageBase64 === 'string' ? imgData.imageBase64 : undefined,
        imageUrl: typeof imgData.imageUrl === 'string' ? imgData.imageUrl : undefined,
        mimeType: typeof imgData.mimeType === 'string' ? imgData.mimeType : undefined,
      }),
    });
  } catch {
    // Non-blocking: generation is still valid if history persistence fails.
  }
}

export function useGeneration(): UseGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  async function generate(prompt: string, format: string, templateId?: string): Promise<GenerationResult | null> {
    setError(null);
    setIsGenerating(true);

    try {
      const adRes = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, format, templateId }),
      });

      if (!adRes.ok) {
        const data = await adRes.json().catch(() => ({ error: 'Failed to generate ad' }));
        throw new Error(data.error || 'Failed to generate ad');
      }

      const adSpec: AdSpec = await adRes.json();
      const fallbackDims = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.square;
      const width = adSpec.metadata?.formatConfig?.width || fallbackDims.width;
      const height = adSpec.metadata?.formatConfig?.height || fallbackDims.height;

      const promptPipeline = adSpec.metadata?.promptPipeline;
      const imageBody: Record<string, unknown> = {
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

      const imgRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageBody),
      });

      if (!imgRes.ok) {
        const data = await imgRes.json().catch(() => ({ error: 'Failed to generate image' }));
        throw new Error(data.error || 'Failed to generate image');
      }

      const imgData = await imgRes.json();
      const imageSrc = imgData.imageBase64 ? `data:image/png;base64,${imgData.imageBase64}` : imgData.imageUrl;

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
      await persistGenerationHistory(prompt.trim(), format, width, height, adSpec, imgData);
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
