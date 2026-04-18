import { describe, it, expect, beforeEach } from 'vitest';
import { useLayerStore } from './layerStore';

describe('layerStore - shapes and background', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('adds a shape layer', () => {
    const id = useLayerStore.getState().addLayer({ type: 'shape', name: 'Rectangle', fabricObject: null });
    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer).toBeTruthy();
    expect(layer?.type).toBe('shape');
  });

  it('background layer is always at index 0', () => {
    useLayerStore.getState().addLayer({ type: 'shape', name: 'Rectangle', fabricObject: null });
    useLayerStore.getState().addLayer({ type: 'text', name: 'Text', fabricObject: null });
    const bgId = useLayerStore.getState().addLayer({ type: 'background', name: 'Background', fabricObject: null });

    const layers = useLayerStore.getState().layers;
    expect(layers[0].id).toBe(bgId);
    expect(layers[0].type).toBe('background');
    expect(layers[0].zIndex).toBe(0);
  });

  it('background layer cannot be moved', () => {
    const bgId = useLayerStore.getState().addLayer({ type: 'background', name: 'Background', fabricObject: null });
    useLayerStore.getState().addLayer({ type: 'shape', name: 'Rect', fabricObject: null });

    useLayerStore.getState().moveLayer(bgId, 'up');
    const layers = useLayerStore.getState().layers;
    expect(layers[0].id).toBe(bgId);
  });

  it('other layers cannot swap with background layer', () => {
    const bgId = useLayerStore.getState().addLayer({ type: 'background', name: 'Background', fabricObject: null });
    const shapeId = useLayerStore.getState().addLayer({ type: 'shape', name: 'Rect', fabricObject: null });

    useLayerStore.getState().moveLayer(shapeId, 'down');
    const layers = useLayerStore.getState().layers;
    expect(layers[0].id).toBe(bgId);
    expect(layers[1].id).toBe(shapeId);
  });

  it('updateShapeStyle updates shape style', () => {
    const id = useLayerStore.getState().addLayer({ type: 'shape', name: 'Rect', fabricObject: null });
    useLayerStore.getState().updateShapeStyle(id, { fill: '#ff0000', cornerRadius: 10 });

    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer?.shapeStyle?.fill).toBe('#ff0000');
    expect(layer?.shapeStyle?.cornerRadius).toBe(10);
  });

  it('updateBackgroundStyle updates background style', () => {
    const id = useLayerStore.getState().addLayer({ type: 'background', name: 'BG', fabricObject: null });
    useLayerStore.getState().updateBackgroundStyle(id, {
      type: 'gradient',
      color: '#1e1e2e',
      gradient: {
        stops: [{ offset: 0, color: '#ff0000' }, { offset: 1, color: '#0000ff' }],
        angle: 90,
      },
    });

    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer?.backgroundStyle?.type).toBe('gradient');
    expect(layer?.backgroundStyle?.gradient?.stops[0].color).toBe('#ff0000');
  });
});
