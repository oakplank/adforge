import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackgroundTool } from './useBackgroundTool';
import { useLayerStore } from '../store/layerStore';

vi.mock('fabric', () => {
  const MockRect = vi.fn().mockImplementation((opts) => ({
    type: 'rect', ...opts, set: vi.fn(), canvas: { requestRenderAll: vi.fn() },
  }));
  const MockGradient = vi.fn().mockImplementation((opts) => ({ type: 'gradient', ...opts }));
  return { Rect: MockRect, Gradient: MockGradient };
});

function makeMockCanvas() {
  return {
    add: vi.fn(),
    sendObjectToBack: vi.fn(),
    renderAll: vi.fn(),
    width: 1080,
    height: 1080,
  } as any;
}

describe('useBackgroundTool', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('adds a background layer at bottom z-index', () => {
    const canvas = makeMockCanvas();
    const { result } = renderHook(() => useBackgroundTool(canvas));

    act(() => { result.current.addBackground(); });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].type).toBe('background');
    expect(layers[0].zIndex).toBe(0);
    expect(canvas.sendObjectToBack).toHaveBeenCalled();
  });

  it('background layer stays at index 0 when other layers exist', () => {
    const canvas = makeMockCanvas();

    // Add a shape first
    useLayerStore.getState().addLayer({ type: 'shape', name: 'Rect', fabricObject: null });

    const { result } = renderHook(() => useBackgroundTool(canvas));
    act(() => { result.current.addBackground(); });

    const layers = useLayerStore.getState().layers;
    expect(layers[0].type).toBe('background');
    expect(layers[0].zIndex).toBe(0);
  });

  it('only allows one background layer', () => {
    const canvas = makeMockCanvas();
    const { result } = renderHook(() => useBackgroundTool(canvas));

    act(() => { result.current.addBackground(); });
    act(() => { result.current.addBackground(); });

    const bgLayers = useLayerStore.getState().layers.filter((l) => l.type === 'background');
    expect(bgLayers).toHaveLength(1);
  });

  it('background cannot be moved above other layers', () => {
    const canvas = makeMockCanvas();
    const { result } = renderHook(() => useBackgroundTool(canvas));

    act(() => { result.current.addBackground(); });
    useLayerStore.getState().addLayer({ type: 'shape', name: 'Rect', fabricObject: null });

    const bgId = useLayerStore.getState().layers[0].id;
    useLayerStore.getState().moveLayer(bgId, 'up');

    // Background should still be at index 0
    expect(useLayerStore.getState().layers[0].type).toBe('background');
  });

  it('applyBackgroundStyle sets solid color', () => {
    const canvas = makeMockCanvas();
    const { result } = renderHook(() => useBackgroundTool(canvas));

    act(() => { result.current.addBackground(); });
    const bgId = useLayerStore.getState().layers[0].id;

    act(() => {
      result.current.applyBackgroundStyle(bgId, { type: 'solid', color: '#ff0000' });
    });

    const layer = useLayerStore.getState().layers[0];
    expect(layer.backgroundStyle?.color).toBe('#ff0000');
  });

  it('applyBackgroundStyle sets gradient', () => {
    const canvas = makeMockCanvas();
    const { result } = renderHook(() => useBackgroundTool(canvas));

    act(() => { result.current.addBackground(); });
    const bgId = useLayerStore.getState().layers[0].id;

    act(() => {
      result.current.applyBackgroundStyle(bgId, {
        type: 'gradient',
        color: '#ff0000',
        gradient: {
          stops: [{ offset: 0, color: '#ff0000' }, { offset: 1, color: '#0000ff' }],
          angle: 180,
        },
      });
    });

    const layer = useLayerStore.getState().layers[0];
    expect(layer.backgroundStyle?.type).toBe('gradient');
    expect(layer.backgroundStyle?.gradient?.stops).toHaveLength(2);
  });
});
