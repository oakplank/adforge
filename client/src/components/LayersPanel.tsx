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
          className={`layer-row ${
            selectedLayerId === layer.id
              ? 'layer-row-active'
              : 'layer-row-idle'
          }`}
          onClick={() => selectLayer(layer.id)}
        >
          <span className="layer-type-pill">{typeLabels[layer.type]}</span>

          <span className={`flex-1 truncate ${!layer.visible ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
            {layer.name}
          </span>

          <button
            data-testid={`visibility-toggle-${layer.id}`}
            onClick={(event) => {
              event.stopPropagation();
              toggleVisibility(layer.id);
            }}
            className="layer-action-button"
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
            className="layer-action-button"
            title="Move up"
          >
            ^
          </button>

          <button
            data-testid={`move-down-${layer.id}`}
            onClick={(event) => {
              event.stopPropagation();
              moveLayer(layer.id, 'down');
            }}
            className="layer-action-button"
            title="Move down"
          >
            v
          </button>

          <button
            data-testid={`delete-layer-${layer.id}`}
            onClick={(event) => {
              event.stopPropagation();
              removeLayer(layer.id);
            }}
            className="layer-action-button text-rose-300 hover:text-rose-200"
            title="Delete layer"
          >
            x
          </button>
        </div>
      ))}

      {layers.length === 0 && <div className="px-3 py-6 text-xs text-zinc-500 text-center">No layers yet</div>}
    </div>
  );
}
