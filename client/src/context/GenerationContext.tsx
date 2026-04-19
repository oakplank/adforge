import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AdSpec } from '../hooks/useGeneration';

interface GenerationState {
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  // The most recent adSpec (from either a fresh generation or a loaded
  // history item). CopySuggestions and other text helpers read this to
  // surface headline/subhead/CTA that match the image on the canvas.
  lastAdSpec: AdSpec | null;
  setLastAdSpec: (spec: AdSpec | null) => void;
  // Which archetype ("category") the user picked for the next generation.
  // null means "no archetype selected" — the server falls back to the
  // General brief. We keep this in context so the PromptBar selector and
  // the useGeneration call site stay in sync.
  selectedArchetypeId: string | null;
  setSelectedArchetypeId: (id: string | null) => void;
}

const GenerationContext = createContext<GenerationState>({
  isGenerating: false,
  setIsGenerating: () => {},
  lastAdSpec: null,
  setLastAdSpec: () => {},
  selectedArchetypeId: null,
  setSelectedArchetypeId: () => {},
});

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastAdSpec, setLastAdSpec] = useState<AdSpec | null>(null);
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string | null>(null);
  return (
    <GenerationContext.Provider
      value={{
        isGenerating,
        setIsGenerating,
        lastAdSpec,
        setLastAdSpec,
        selectedArchetypeId,
        setSelectedArchetypeId,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGenerationState() {
  return useContext(GenerationContext);
}
