import { useCallback } from 'react';
import { IText, type Canvas } from 'fabric';
import { useLayerStore } from '../store/layerStore';

export function useTextTool(canvas: Canvas | null) {
  const addLayer = useLayerStore((s) => s.addLayer);
  const selectLayer = useLayerStore((s) => s.selectLayer);

  const addText = useCallback(() => {
    if (!canvas) return;

    const text = new IText('Your Text Here', {
      fontSize: 48,
      fill: '#ffffff',
      fontFamily: 'sans-serif',
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    const layerId = addLayer({
      type: 'text',
      name: 'Text',
      fabricObject: text,
    });
    selectLayer(layerId);
  }, [canvas, addLayer, selectLayer]);

  return { addText };
}
