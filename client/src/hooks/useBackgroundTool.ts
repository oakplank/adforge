import { useCallback } from 'react';
import { Rect, Gradient, type Canvas } from 'fabric';
import { useLayerStore } from '../store/layerStore';
import { DEFAULT_BACKGROUND_STYLE } from '../types/shapes';
import type { BackgroundStyle } from '../types/shapes';

export function useBackgroundTool(canvas: Canvas | null) {
  const addLayer = useLayerStore((s) => s.addLayer);
  const layers = useLayerStore((s) => s.layers);
  const selectLayer = useLayerStore((s) => s.selectLayer);

  const addBackground = useCallback(() => {
    if (!canvas) return;
    // Only one background allowed
    if (layers.some((l) => l.type === 'background')) return;

    const w = canvas.width ?? 1080;
    const h = canvas.height ?? 1080;

    const rect = new Rect({
      left: 0,
      top: 0,
      width: w,
      height: h,
      fill: DEFAULT_BACKGROUND_STYLE.color,
      selectable: false,
      evented: false,
    });

    canvas.add(rect);
    canvas.sendObjectToBack(rect);
    canvas.renderAll();

    const layerId = addLayer({
      type: 'background',
      name: 'Background',
      fabricObject: rect,
    });
    selectLayer(layerId);
  }, [canvas, layers, addLayer, selectLayer]);

  const applyBackgroundStyle = useCallback((layerId: string, style: BackgroundStyle) => {
    const layer = useLayerStore.getState().layers.find((l) => l.id === layerId);
    if (!layer || layer.type !== 'background' || !layer.fabricObject) return;

    const obj = layer.fabricObject as Rect;
    if (style.type === 'solid') {
      obj.set('fill', style.color);
    } else if (style.type === 'gradient' && style.gradient) {
      const { stops, angle } = style.gradient;
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const grad = new Gradient({
        type: 'linear',
        coords: {
          x1: 0.5 - cos * 0.5,
          y1: 0.5 - sin * 0.5,
          x2: 0.5 + cos * 0.5,
          y2: 0.5 + sin * 0.5,
        },
        gradientUnits: 'percentage',
        colorStops: stops.map((s) => ({ offset: s.offset, color: s.color })),
      });
      obj.set('fill', grad);
    }

    if (obj.canvas && typeof obj.canvas.requestRenderAll === 'function') {
      obj.canvas.requestRenderAll();
    }

    useLayerStore.getState().updateBackgroundStyle(layerId, style);
  }, []);

  return { addBackground, applyBackgroundStyle };
}
