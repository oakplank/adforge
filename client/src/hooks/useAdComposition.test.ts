import { describe, it, expect, beforeEach } from 'vitest';
import { useLayerStore } from '../store/layerStore';

// useAdComposition now renders only the Gemini image as a background layer;
// headline/subhead/CTA/overlays are no longer auto-stamped. Users compose
// text via the editor toolbar. These tests cover the layer-store contract
// that composition relies on (clear, add background, style updates).

describe('Ad Composition layer store contract', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('adds a single Background Image layer', () => {
    const store = useLayerStore.getState();
    store.addLayer({ type: 'background', name: 'Background Image', fabricObject: null });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('Background Image');
    expect(layers[0].type).toBe('background');
  });

  it('clears existing layers before composing a new result', () => {
    const store = useLayerStore.getState();
    store.addLayer({ type: 'text', name: 'Stale Headline', fabricObject: null });
    store.addLayer({ type: 'shape', name: 'Stale CTA Strip', fabricObject: null });
    expect(useLayerStore.getState().layers).toHaveLength(2);

    store.setLayers([]);
    store.addLayer({ type: 'background', name: 'Background Image', fabricObject: null });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('Background Image');
  });

  it('supports post-compose text style edits on user-added layers', () => {
    const store = useLayerStore.getState();
    const id = store.addLayer({ type: 'text', name: 'Headline', fabricObject: null });
    store.updateTextStyle(id, {
      fontFamily: 'Inter',
      fontSize: 72,
      fill: '#FFFFFF',
      fontWeight: 'bold',
      textAlign: 'center',
    });

    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer?.textStyle?.fontSize).toBe(72);
    expect(layer?.textStyle?.fontWeight).toBe('bold');
    expect(layer?.textStyle?.textAlign).toBe('center');
  });
});
