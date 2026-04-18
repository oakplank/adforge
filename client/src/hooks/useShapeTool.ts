import { useCallback } from 'react';
import { Rect, Circle, Line, Gradient, type Canvas } from 'fabric';
import { useLayerStore } from '../store/layerStore';
import { DEFAULT_SHAPE_STYLE } from '../types/shapes';
import type { ShapeKind } from '../types/shapes';
import type { ShapeStyle } from '../types/shapes';

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '').trim();
  if (!/^[a-fA-F0-9]{6}$/.test(clean)) {
    return `rgba(0,0,0,${Math.max(0, Math.min(1, alpha))})`;
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

function applyGradientFill(obj: Rect | Circle, style: ShapeStyle): void {
  const rad = (style.gradient.angle * Math.PI) / 180;
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
    colorStops: [
      { offset: 0, color: hexToRgba(style.gradient.startColor, style.gradient.startOpacity) },
      { offset: 1, color: hexToRgba(style.gradient.endColor, style.gradient.endOpacity) },
    ],
  });
  obj.set('fill', grad);
}

export function useShapeTool(canvas: Canvas | null) {
  const addLayer = useLayerStore((s) => s.addLayer);
  const selectLayer = useLayerStore((s) => s.selectLayer);
  const updateShapeStyle = useLayerStore((s) => s.updateShapeStyle);

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
      case 'gradient-band': {
        const bandWidth = Math.round(cw * 0.42);
        obj = new Rect({
          left: cw - bandWidth,
          top: 0,
          width: bandWidth,
          height: ch,
          fill: 'rgba(0,0,0,0)',
          stroke: 'transparent',
          strokeWidth: 0,
          rx: 0,
          ry: 0,
        });
        break;
      }
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
      'gradient-band': 'Gradient Band',
      circle: 'Circle',
      line: 'Line',
    };

    const layerId = addLayer({
      type: 'shape',
      name: names[kind],
      fabricObject: obj,
    });

    if (kind === 'gradient-band' && (obj.type === 'rect' || obj instanceof Rect)) {
      const gradientStyle: ShapeStyle = {
        ...DEFAULT_SHAPE_STYLE,
        fillMode: 'gradient',
        stroke: 'transparent',
        strokeWidth: 0,
        cornerRadius: 0,
        gradient: {
          startColor: '#1E4D3A',
          endColor: '#1E4D3A',
          startOpacity: 0,
          endOpacity: 0.78,
          angle: 0,
        },
      };
      applyGradientFill(obj as Rect, gradientStyle);
      updateShapeStyle(layerId, gradientStyle);
    } else {
      updateShapeStyle(layerId, DEFAULT_SHAPE_STYLE);
    }

    selectLayer(layerId);
  }, [canvas, addLayer, selectLayer, updateShapeStyle]);

  return { addShape };
}
