import { useCallback, useEffect, useState } from 'react';
import type { AdSpec } from './useGeneration';

export interface GenerationHistoryItem {
  id: string;
  createdAt: string;
  prompt: string;
  format: string;
  width?: number;
  height?: number;
  imagePrompt: string;
  enhancedPrompt?: string;
  systemPrompt?: string;
  model?: string;
  adSpec: AdSpec;
  imageUrl: string;
  mimeType?: string;
}

interface HistoryResponse {
  generations: GenerationHistoryItem[];
}

export function useGenerationHistory() {
  const [generations, setGenerations] = useState<GenerationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generations?limit=40');
      if (!response.ok) {
        throw new Error('Failed to load generation history');
      }
      const data = (await response.json()) as HistoryResponse;
      setGenerations(Array.isArray(data.generations) ? data.generations : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load generation history';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    generations,
    isLoading,
    error,
    refresh,
  };
}
