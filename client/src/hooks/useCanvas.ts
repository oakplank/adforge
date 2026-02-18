import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from 'fabric';

export interface UseCanvasOptions {
  width?: number;
  height?: number;
}

export function useCanvas(options: UseCanvasOptions = {}) {
  const { width = 1080, height = 1080 } = options;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#1a1a2e',
    });

    setCanvas(fabricCanvas);

    return fabricCanvas;
  }, [width, height]);

  useEffect(() => {
    const fabricCanvas = initCanvas();
    return () => {
      fabricCanvas?.dispose();
    };
  }, [initCanvas]);

  return { canvasRef, canvas };
}
