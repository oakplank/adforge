import { useCallback } from 'react';
import { IText, Shadow, type Canvas } from 'fabric';
import { useLayerStore } from '../store/layerStore';
import { sampleRegionContrast } from '../utils/canvasContrast';

// Defaults tuned for an ad canvas, not a generic whiteboard:
// - Font scales with canvas width so a 1080 square and a 1080×1920 story
//   both read as "large headline" rather than a tiny blob.
// - Weight is bold because ad typography almost always is.
// - Fill + shadow are picked from the pixels under the drop point so the
//   text doesn't get lost on the image the user just generated.
function chooseHeadlineFontSize(canvasWidth: number): number {
  const scaled = Math.round(canvasWidth * 0.075);
  return Math.min(144, Math.max(40, scaled));
}

export function useTextTool(canvas: Canvas | null) {
  const addLayer = useLayerStore((s) => s.addLayer);
  const selectLayer = useLayerStore((s) => s.selectLayer);

  const addText = useCallback(() => {
    if (!canvas) return;

    const canvasWidth = canvas.width ?? 1080;
    const canvasHeight = canvas.height ?? 1080;
    const fontSize = chooseHeadlineFontSize(canvasWidth);

    // Place headline in the upper third where the eye lands first. Sample
    // that same region so we know which fill reads best against it.
    const left = canvasWidth / 2;
    const top = canvasHeight * 0.28;
    const sampleRect = {
      left: Math.round(canvasWidth * 0.1),
      top: Math.round(top - fontSize * 0.6),
      width: Math.round(canvasWidth * 0.8),
      height: Math.round(fontSize * 1.4),
    };
    const contrast = sampleRegionContrast(canvas, sampleRect);

    const text = new IText('Your headline here', {
      fontSize,
      fontWeight: 'bold',
      fill: contrast.fill,
      fontFamily: 'Space Grotesk, Inter, system-ui, sans-serif',
      textAlign: 'center',
      left,
      top,
      originX: 'center',
      originY: 'center',
      shadow: contrast.needsShadow
        ? new Shadow({
            color: contrast.fill === '#ffffff'
              ? 'rgba(0,0,0,0.55)'
              : 'rgba(255,255,255,0.55)',
            offsetX: 0,
            offsetY: 2,
            blur: 12,
          })
        : null,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    const layerId = addLayer({
      type: 'text',
      name: 'Headline',
      fabricObject: text,
    });
    selectLayer(layerId);
  }, [canvas, addLayer, selectLayer]);

  return { addText };
}
