import { useLayerStore } from '../store/layerStore';
import type { LayerType } from '../types/layers';

const typeLabels: Record<LayerType, string> = {
  image: 'IMG',
  text: 'TXT',
  shape: 'SHP',
  background: 'BG',
  cta: 'CTA',
};

export function LayersPanel() {
  const { layers, selectedLayerId, selectLayer, removeLayer, toggleVisibility, moveLayer } = useLayerStore();

  const sortedLayers = [...layers].reverse();

  return (
    <div data-testid="layers-list" className="flex flex-col">
      {sortedLayers.map((layer) => (
        <div
          key={layer.id}
          data-testid={`layer-item-${layer.id}`}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm border-b transition-colors ${
            selectedLayerId === layer.id
              ? 'bg-orange-500/15 border-l-2 border-l-orange-400 border-white/10'
              : 'border-white/[0.07] hover:bg-white/[0.04]'
          }`}
          onClick={() => selectLayer(layer.id)}
        >
          <span className="w-8 text-[10px] text-center tracking-wide text-zinc-400">{typeLabels[layer.type]}</span>

          <span className={`flex-1 truncate ${!layer.visible ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
            {layer.name}
          </span>

          <button
            data-testid={`visibility-toggle-${layer.id}`}
            onClick={(event) => {
              event.stopPropagation();
              toggleVisibility(layer.id);
            }}
            className="text-xs text-zinc-400 hover:text-zinc-100 w-5 text-center"
            title={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            {layer.visible ? 'ON' : 'OFF'}
          </button>

          <button
            data-testid={`move-up-${layer.id}`}
            onClick={(event) => {
              event.stopPropagation();
              moveLayer(layer.id, 'up');
            }}
            className="text-xs text-zinc-400 hover:text-zinc-100"
            title="Move up"
          >
            +
          </button>

          <button
            data-testid={`move-down-${layer.id}`}
            onClick={(event) => {
              event.stopPropagation();
              moveLayer(layer.id, 'down');
            }}
            className="text-xs text-zinc-400 hover:text-zinc-100"
            title="Move down"
          >
            -
          </button>

          <button
            data-testid={`delete-layer-${layer.id}`}
            onClick={(event) => {
              event.stopPropagation();
              removeLayer(layer.id);
            }}
            className="text-xs text-rose-300 hover:text-rose-200"
            title="Delete layer"
          >
            x
          </button>
        </div>
      ))}

      {layers.length === 0 && <div className="px-3 py-4 text-xs text-zinc-500 text-center">No layers yet</div>}
    </div>
  );
}
