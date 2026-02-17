import { describe, it, expect, beforeEach } from 'vitest';
import { useLayerStore } from './layerStore';

describe('layerStore', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('adds a layer', () => {
    const id = useLayerStore.getState().addLayer({ type: 'image', name: 'Image 1', fabricObject: null });
    expect(id).toBeTruthy();
    expect(useLayerStore.getState().layers).toHaveLength(1);
    expect(useLayerStore.getState().layers[0].name).toBe('Image 1');
    expect(useLayerStore.getState().layers[0].visible).toBe(true);
  });

  it('removes a layer', () => {
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Text 1', fabricObject: null });
    useLayerStore.getState().removeLayer(id);
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it('clears selection when removing selected layer', () => {
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Text 1', fabricObject: null });
    useLayerStore.getState().selectLayer(id);
    useLayerStore.getState().removeLayer(id);
    expect(useLayerStore.getState().selectedLayerId).toBeNull();
  });

  it('selects a layer', () => {
    const id = useLayerStore.getState().addLayer({ type: 'shape', name: 'Shape 1', fabricObject: null });
    useLayerStore.getState().selectLayer(id);
    expect(useLayerStore.getState().selectedLayerId).toBe(id);
  });

  it('toggles visibility', () => {
    const id = useLayerStore.getState().addLayer({ type: 'image', name: 'Img', fabricObject: null });
    expect(useLayerStore.getState().layers[0].visible).toBe(true);
    useLayerStore.getState().toggleVisibility(id);
    expect(useLayerStore.getState().layers[0].visible).toBe(false);
    useLayerStore.getState().toggleVisibility(id);
    expect(useLayerStore.getState().layers[0].visible).toBe(true);
  });

  it('moves a layer up', () => {
    useLayerStore.getState().addLayer({ type: 'background', name: 'BG', fabricObject: null });
    const id2 = useLayerStore.getState().addLayer({ type: 'text', name: 'Text', fabricObject: null });
    // id2 is at index 1, move up should be no-op (already at top)
    useLayerStore.getState().moveLayer(id2, 'up');
    // still at top (index 1 is max)
    expect(useLayerStore.getState().layers[1].name).toBe('Text');
  });

  it('moves a layer down', () => {
    const id1 = useLayerStore.getState().addLayer({ type: 'background', name: 'BG', fabricObject: null });
    useLayerStore.getState().addLayer({ type: 'text', name: 'Text', fabricObject: null });
    // id1 at index 0, move down is no-op
    useLayerStore.getState().moveLayer(id1, 'down');
    expect(useLayerStore.getState().layers[0].name).toBe('BG');
  });

  it('reorders layers correctly', () => {
    useLayerStore.getState().addLayer({ type: 'background', name: 'BG', fabricObject: null });
    useLayerStore.getState().addLayer({ type: 'image', name: 'Img', fabricObject: null });
    useLayerStore.getState().addLayer({ type: 'text', name: 'Text', fabricObject: null });
    
    // Move first to last
    useLayerStore.getState().reorderLayer(0, 2);
    const names = useLayerStore.getState().layers.map((l) => l.name);
    expect(names).toEqual(['Img', 'Text', 'BG']);
    // zIndex should match position
    expect(useLayerStore.getState().layers[0].zIndex).toBe(0);
    expect(useLayerStore.getState().layers[2].zIndex).toBe(2);
  });

  it('moveLayer swaps adjacent layers', () => {
    useLayerStore.getState().addLayer({ type: 'text', name: 'A', fabricObject: null });
    const id2 = useLayerStore.getState().addLayer({ type: 'text', name: 'B', fabricObject: null });
    useLayerStore.getState().addLayer({ type: 'image', name: 'C', fabricObject: null });

    // Move B (index 1) down to index 0
    useLayerStore.getState().moveLayer(id2, 'down');
    const names = useLayerStore.getState().layers.map((l) => l.name);
    expect(names).toEqual(['B', 'A', 'C']);
  });

  it('moveLayer cannot swap with background layer', () => {
    useLayerStore.getState().addLayer({ type: 'background', name: 'BG', fabricObject: null });
    const id2 = useLayerStore.getState().addLayer({ type: 'text', name: 'Text', fabricObject: null });

    useLayerStore.getState().moveLayer(id2, 'down');
    const names = useLayerStore.getState().layers.map((l) => l.name);
    expect(names).toEqual(['BG', 'Text']);
  });
});
