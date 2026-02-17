import { useCallback } from 'react';
import { Rect, Circle, Line, type Canvas } from 'fabric';
import { useLayerStore } from '../store/layerStore';
import { DEFAULT_SHAPE_STYLE } from '../types/shapes';
import type { ShapeKind } from '../types/shapes';

export function useShapeTool(canvas: Canvas | null) {
  const addLayer = useLayerStore((s) => s.addLayer);
  const selectLayer = useLayerStore((s) => s.selectLayer);

  const addShape = useCallback((kind: ShapeKind) => {
    if (!canvas) return;

    const cw = canvas.width ?? 1080;
    const ch = canvas.height ?? 1080;
    const { fill, stroke, strokeWidth, cornerRadius } = DEFAULT_SHAPE_STYLE;

    let obj: Rect | Circle | Line;

    switch (kind) {
      case 'rectangle':
        obj = new Rect({
          left: cw / 2 - 75,
          top: ch / 2 - 50,
          width: 150,
          height: 100,
          fill,
          stroke,
          strokeWidth,
          rx: cornerRadius,
          ry: cornerRadius,
        });
        break;
      case 'circle':
        obj = new Circle({
          left: cw / 2 - 50,
          top: ch / 2 - 50,
          radius: 50,
          fill,
          stroke,
          strokeWidth,
        });
        break;
      case 'line':
        obj = new Line([cw / 2 - 75, ch / 2, cw / 2 + 75, ch / 2], {
          stroke: fill,
          strokeWidth: 3,
        });
        break;
    }

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();

    const names: Record<ShapeKind, string> = {
      rectangle: 'Rectangle',
      circle: 'Circle',
      line: 'Line',
    };

    const layerId = addLayer({
      type: 'shape',
      name: names[kind],
      fabricObject: obj,
    });
    selectLayer(layerId);
  }, [canvas, addLayer, selectLayer]);

  return { addShape };
}
