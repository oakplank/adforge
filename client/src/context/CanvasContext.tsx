import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Canvas } from 'fabric';

interface CanvasContextValue {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas | null) => void;
}

const CanvasContext = createContext<CanvasContextValue>({
  canvas: null,
  setCanvas: () => {},
});

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  return (
    <CanvasContext.Provider value={{ canvas, setCanvas }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  return useContext(CanvasContext);
}
