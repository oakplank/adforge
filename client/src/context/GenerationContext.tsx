import { createContext, useContext, useState, type ReactNode } from 'react';

interface GenerationState {
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

const GenerationContext = createContext<GenerationState>({ isGenerating: false, setIsGenerating: () => {} });

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [isGenerating, setIsGenerating] = useState(false);
  return (
    <GenerationContext.Provider value={{ isGenerating, setIsGenerating }}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGenerationState() {
  return useContext(GenerationContext);
}
