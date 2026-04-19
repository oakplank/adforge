import { useCallback } from 'react';
import { Canvas, FabricImage, Rect } from 'fabric';
import type { GenerationResult } from './useGeneration';
import { useLayerStore } from '../store/layerStore';
import { trimLetterbox } from '../utils/trimLetterbox';

interface ComposeOptions {
  canvas: Canvas | null;
  formatId: string;
  canvasWidth: number;
  canvasHeight: number;
}

// Place the image to cover the full canvas (no letterbox), with a focal bias
// that leaves the quieter side of the frame for user-added text.
function placeCoverImage(
  img: FabricImage,
  canvasWidth: number,
  canvasHeight: number,
  preferredAlignment: 'left' | 'center' | 'right' | 'auto' = 'auto',
) {
  const sourceWidth = img.width || canvasWidth;
  const sourceHeight = img.height || canvasHeight;
  const scale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight) * 1.03;
  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;
  const overflowX = Math.max(0, scaledWidth - canvasWidth);
  const overflowY = Math.max(0, scaledHeight - canvasHeight);

  let focalX = 0.5;
  if (preferredAlignment === 'left') focalX = 0.62;
  else if (preferredAlignment === 'right') focalX = 0.38;

  img.set({
    left: -overflowX * focalX,
    top: -overflowY * 0.5,
    scaleX: scale,
    scaleY: scale,
    selectable: true,
    evented: true,
  });
}

// Render the generated image onto the canvas as an editable background
// layer. No headline/subhead/CTA/overlays are stamped — users compose text
// on top themselves via the editor toolbar. This keeps the studio focused
// on what the model is actually good at (the image) and lets the editor be
// the place where ad copy gets shaped.
export function useAdComposition({ canvas, canvasWidth, canvasHeight }: ComposeOptions) {
  const addLayer = useLayerStore((s) => s.addLayer);
  const setLayers = useLayerStore((s) => s.setLayers);

  const compose = useCallback(
    async (result: GenerationResult) => {
      if (!canvas) return;

      canvas.clear();
      setLayers([]);

      const { adSpec, imageUrl, imageBase64, mimeType } = result;
      const preferredAlignment =
        adSpec.metadata?.placementHints?.preferredAlignment || 'auto';

      const imgSrc = imageBase64
        ? `data:${mimeType || 'image/png'};base64,${imageBase64}`
        : imageUrl || '';

      if (!imgSrc) {
        canvas.renderAll();
        return;
      }

      try {
        // Gemini sometimes returns letterboxed/pillarboxed canvases even with
        // aspectRatio hinting. Crop solid bars before the cover fit so the
        // subject actually fills the frame instead of being shrunk.
        const trimResult = await trimLetterbox(imgSrc).catch(() => null);
        const finalSrc = trimResult?.trimmed ? trimResult.src : imgSrc;
        const img = await FabricImage.fromURL(finalSrc);
        placeCoverImage(img, canvasWidth, canvasHeight, preferredAlignment);
        canvas.add(img);
        addLayer({ type: 'background', name: 'Background Image', fabricObject: img });
      } catch {
        const bgRect = new Rect({
          left: 0,
          top: 0,
          width: canvasWidth,
          height: canvasHeight,
          fill: adSpec.colors.background || '#1a1a2e',
          selectable: false,
          evented: false,
        });
        canvas.add(bgRect);
        addLayer({ type: 'background', name: 'Background', fabricObject: bgRect });
      }

      canvas.renderAll();
    },
    [canvas, canvasWidth, canvasHeight, addLayer, setLayers],
  );

  return { compose };
}
