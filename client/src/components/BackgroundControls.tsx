import { useLayerStore } from '../store/layerStore';
import { useBackgroundTool } from '../hooks/useBackgroundTool';
import type { BackgroundStyle } from '../types/shapes';

export function BackgroundControls({ canvas }: { canvas: any }) {
  const selectedLayerId = useLayerStore((s) => s.selectedLayerId);
  const layers = useLayerStore((s) => s.layers);
  const { applyBackgroundStyle } = useBackgroundTool(canvas);

  const layer = layers.find((l) => l.id === selectedLayerId);
  if (!layer || layer.type !== 'background') return null;

  const style: BackgroundStyle = layer.backgroundStyle ?? { type: 'solid', color: '#1e1e2e' };

  const apply = (partial: Partial<BackgroundStyle>) => {
    if (!selectedLayerId) return;
    const newStyle = { ...style, ...partial } as BackgroundStyle;
    applyBackgroundStyle(selectedLayerId, newStyle);
  };

  return (
    <div className="space-y-2" data-testid="background-controls">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">Background</div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-16">Type</label>
        <select
          value={style.type}
          onChange={(e) => {
            const type = e.target.value as 'solid' | 'gradient';
            if (type === 'gradient') {
              apply({
                type: 'gradient',
                gradient: style.gradient ?? {
                  stops: [{ offset: 0, color: style.color }, { offset: 1, color: '#000000' }],
                  angle: 180,
                },
              });
            } else {
              apply({ type: 'solid' });
            }
          }}
          className="bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1"
          data-testid="background-type-select"
        >
          <option value="solid">Solid</option>
          <option value="gradient">Gradient</option>
        </select>
      </div>
      {style.type === 'solid' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400 w-16">Color</label>
          <input
            type="color"
            value={style.color}
            onChange={(e) => apply({ color: e.target.value })}
            className="w-8 h-6 rounded cursor-pointer bg-transparent"
            data-testid="background-color"
          />
        </div>
      )}
      {style.type === 'gradient' && style.gradient && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 w-16">Stop 1</label>
            <input
              type="color"
              value={style.gradient.stops[0].color}
              onChange={(e) => {
                const stops: BackgroundStyle['gradient'] = {
                  ...style.gradient!,
                  stops: [{ ...style.gradient!.stops[0], color: e.target.value }, style.gradient!.stops[1]],
                };
                apply({ gradient: stops });
              }}
              className="w-8 h-6 rounded cursor-pointer bg-transparent"
              data-testid="gradient-stop-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 w-16">Stop 2</label>
            <input
              type="color"
              value={style.gradient.stops[1].color}
              onChange={(e) => {
                const stops: BackgroundStyle['gradient'] = {
                  ...style.gradient!,
                  stops: [style.gradient!.stops[0], { ...style.gradient!.stops[1], color: e.target.value }],
                };
                apply({ gradient: stops });
              }}
              className="w-8 h-6 rounded cursor-pointer bg-transparent"
              data-testid="gradient-stop-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-400 w-16">Angle</label>
            <input
              type="number"
              value={style.gradient.angle}
              min={0}
              max={360}
              onChange={(e) => {
                apply({
                  gradient: { ...style.gradient!, angle: Number(e.target.value) },
                });
              }}
              className="w-14 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1"
              data-testid="gradient-angle"
            />
          </div>
        </>
      )}
    </div>
  );
}
