import { useLayerStore } from '../store/layerStore';
import type { ShapeStyle } from '../types/shapes';

export function ShapeControls() {
  const selectedLayerId = useLayerStore((s) => s.selectedLayerId);
  const layers = useLayerStore((s) => s.layers);
  const updateShapeStyle = useLayerStore((s) => s.updateShapeStyle);

  const layer = layers.find((l) => l.id === selectedLayerId);
  if (!layer || layer.type !== 'shape') return null;

  const style: ShapeStyle = layer.shapeStyle ?? {
    fill: '#6366f1', stroke: '#000000', strokeWidth: 0, cornerRadius: 0,
  };

  const update = (partial: Partial<ShapeStyle>) => {
    if (!selectedLayerId) return;
    updateShapeStyle(selectedLayerId, partial);

    // Sync to fabric object
    const obj = layer.fabricObject;
    if (obj && typeof obj.set === 'function') {
      if (partial.fill !== undefined) obj.set('fill', partial.fill);
      if (partial.stroke !== undefined) obj.set('stroke', partial.stroke);
      if (partial.strokeWidth !== undefined) obj.set('strokeWidth', partial.strokeWidth);
      if (partial.cornerRadius !== undefined) {
        obj.set('rx' as any, partial.cornerRadius);
        obj.set('ry' as any, partial.cornerRadius);
      }
      if (obj.canvas && typeof obj.canvas.requestRenderAll === 'function') {
        obj.canvas.requestRenderAll();
      }
    }
  };

  return (
    <div className="space-y-2" data-testid="shape-controls">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">Shape</div>
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
