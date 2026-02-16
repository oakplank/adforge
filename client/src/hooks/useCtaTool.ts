import { useCallback } from 'react';
import { Rect, IText, Group, type Canvas } from 'fabric';
import { useLayerStore } from '../store/layerStore';
import { DEFAULT_CTA_STYLE } from '../types/layers';

export function useCtaTool(canvas: Canvas | null) {
  const addLayer = useLayerStore((s) => s.addLayer);
  const selectLayer = useLayerStore((s) => s.selectLayer);

  const addCta = useCallback(() => {
    if (!canvas) return;

    const { buttonColor, textContent, textColor, cornerRadius, paddingX, paddingY } = DEFAULT_CTA_STYLE;

    const text = new IText(textContent, {
      fontSize: 24,
      fill: textColor,
      fontFamily: 'sans-serif',
      originX: 'center',
      originY: 'center',
    });

    const textWidth = text.width ?? 100;
    const textHeight = text.height ?? 30;

    const rect = new Rect({
      width: textWidth + paddingX * 2,
      height: textHeight + paddingY * 2,
      fill: buttonColor,
      rx: cornerRadius,
      ry: cornerRadius,
      originX: 'center',
      originY: 'center',
    });

    const group = new Group([rect, text], {
      left: (canvas.width ?? 1080) / 2,
      top: (canvas.height ?? 1080) / 2,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();

    const layerId = addLayer({
      type: 'cta',
      name: 'CTA Button',
      fabricObject: group,
    });
    selectLayer(layerId);
  }, [canvas, addLayer, selectLayer]);

  return { addCta };
}
