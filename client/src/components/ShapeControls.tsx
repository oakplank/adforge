import { useLayerStore } from '../store/layerStore';
import type { ShapeStyle } from '../types/shapes';
import { Gradient } from 'fabric';

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

export function ShapeControls() {
  const selectedLayerId = useLayerStore((s) => s.selectedLayerId);
  const layers = useLayerStore((s) => s.layers);
  const updateShapeStyle = useLayerStore((s) => s.updateShapeStyle);

  const layer = layers.find((l) => l.id === selectedLayerId);
  if (!layer || layer.type !== 'shape') return null;

  const style: ShapeStyle = layer.shapeStyle ?? {
    fill: '#6366f1',
    stroke: '#000000',
    strokeWidth: 0,
    cornerRadius: 0,
    fillMode: 'solid',
    gradient: {
      startColor: '#1E4D3A',
      endColor: '#1E4D3A',
      startOpacity: 0,
      endOpacity: 0.78,
      angle: 0,
    },
  };

  type ShapeStylePatch = Omit<Partial<ShapeStyle>, 'gradient'> & {
    gradient?: Partial<ShapeStyle['gradient']>;
  };

  const updateGradient = (partial: Partial<ShapeStyle['gradient']>) => {
    update({ gradient: partial });
  };

  const update = (partial: ShapeStylePatch) => {
    if (!selectedLayerId) return;
    const nextStyle: ShapeStyle = {
      ...style,
      ...partial,
      gradient: {
        ...style.gradient,
        ...(partial.gradient ?? {}),
      },
    };
    updateShapeStyle(selectedLayerId, nextStyle);

    // Sync to fabric object
    const obj = layer.fabricObject;
    if (obj && typeof obj.set === 'function') {
      if (nextStyle.fillMode === 'gradient') {
        const angle = nextStyle.gradient.angle;
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
          colorStops: [
            { offset: 0, color: hexToRgba(nextStyle.gradient.startColor, nextStyle.gradient.startOpacity) },
            { offset: 1, color: hexToRgba(nextStyle.gradient.endColor, nextStyle.gradient.endOpacity) },
          ],
        });
        obj.set('fill', grad as any);
      } else {
        obj.set('fill', nextStyle.fill);
      }
      obj.set('stroke', nextStyle.stroke);
      obj.set('strokeWidth', nextStyle.strokeWidth);
      obj.set('rx' as any, nextStyle.cornerRadius);
      obj.set('ry' as any, nextStyle.cornerRadius);
      if (obj.canvas && typeof obj.canvas.requestRenderAll === 'function') {
        obj.canvas.requestRenderAll();
      }
    }
  };

  return (
    <div className="space-y-2" data-testid="shape-controls">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">Shape</div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-16">Fill Type</label>
        <select
          value={style.fillMode}
          onChange={(e) => update({ fillMode: e.target.value as ShapeStyle['fillMode'] })}
          className="bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1"
          data-testid="shape-fill-mode"
        >
          <option value="solid">Solid</option>
          <option value="gradient">Gradient</option>
        </select>
      </div>
      {style.fillMode === 'solid' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 w-16">Fill</label>
          <input
            type="color"
            value={style.fill}
            onChange={(e) => update({ fill: e.target.value })}
            className="w-8 h-6 rounded cursor-pointer bg-transparent"
            data-testid="shape-fill-color"
          />
          <span className="text-xs text-zinc-400">{style.fill}</span>
        </div>
      )}
      {style.fillMode === 'gradient' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 w-16">Start</label>
            <input
              type="color"
              value={style.gradient.startColor}
              onChange={(e) => updateGradient({ startColor: e.target.value })}
              className="w-8 h-6 rounded cursor-pointer bg-transparent"
              data-testid="shape-gradient-start-color"
            />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(style.gradient.startOpacity * 100)}
              onChange={(e) => updateGradient({ startOpacity: Number(e.target.value) / 100 })}
              className="flex-1"
              data-testid="shape-gradient-start-opacity"
            />
            <span className="text-[11px] text-zinc-500 w-10 text-right">
              {Math.round(style.gradient.startOpacity * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 w-16">End</label>
            <input
              type="color"
              value={style.gradient.endColor}
              onChange={(e) => updateGradient({ endColor: e.target.value })}
              className="w-8 h-6 rounded cursor-pointer bg-transparent"
              data-testid="shape-gradient-end-color"
            />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(style.gradient.endOpacity * 100)}
              onChange={(e) => updateGradient({ endOpacity: Number(e.target.value) / 100 })}
              className="flex-1"
              data-testid="shape-gradient-end-opacity"
            />
            <span className="text-[11px] text-zinc-500 w-10 text-right">
              {Math.round(style.gradient.endOpacity * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 w-16">Angle</label>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={style.gradient.angle}
              onChange={(e) => updateGradient({ angle: Number(e.target.value) })}
              className="flex-1"
              data-testid="shape-gradient-angle-slider"
            />
            <input
              type="number"
              value={style.gradient.angle}
              min={-180}
              max={180}
              onChange={(e) => updateGradient({ angle: Number(e.target.value) })}
              className="w-20 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1"
              data-testid="shape-gradient-angle"
            />
          </div>
        </>
      )}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-16">Stroke</label>
        <input
          type="color"
          value={style.stroke}
          onChange={(e) => update({ stroke: e.target.value })}
          className="w-8 h-6 rounded cursor-pointer bg-transparent"
          data-testid="shape-stroke-color"
        />
        <input
          type="number"
          value={style.strokeWidth}
          min={0}
          max={20}
          onChange={(e) => update({ strokeWidth: Number(e.target.value) })}
          className="w-14 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1"
          data-testid="shape-stroke-width"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-16">Radius</label>
        <input
          type="number"
          value={style.cornerRadius}
          min={0}
          max={100}
          onChange={(e) => update({ cornerRadius: Number(e.target.value) })}
          className="w-14 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1"
          data-testid="shape-corner-radius"
        />
      </div>
    </div>
  );
}
