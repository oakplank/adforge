import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShapeTool } from './useShapeTool';
import { useLayerStore } from '../store/layerStore';

vi.mock('fabric', () => {
  const MockRect = vi.fn().mockImplementation((opts) => ({ type: 'rect', ...opts, set: vi.fn() }));
  const MockCircle = vi.fn().mockImplementation((opts) => ({ type: 'circle', ...opts, set: vi.fn() }));
  const MockLine = vi.fn().mockImplementation((_coords, opts) => ({ type: 'line', ...opts, set: vi.fn() }));
  return { Rect: MockRect, Circle: MockCircle, Line: MockLine };
});

function makeMockCanvas() {
  return {
    add: vi.fn(),
    setActiveObject: vi.fn(),
    renderAll: vi.fn(),
    width: 1080,
    height: 1080,
  } as any;
}

describe('useShapeTool', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('adds a rectangle shape layer', () => {
    const canvas = makeMockCanvas();
    const { result } = renderHook(() => useShapeTool(canvas));

    act(() => { result.current.addShape('rectangle'); });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].type).toBe('shape');
    expect(layers[0].name).toBe('Rectangle');
    expect(canvas.add).toHaveBeenCalled();
  });

  it('adds a circle shape layer', () => {
    const canvas = makeMockCanvas();
    const { result } = renderHook(() => useShapeTool(canvas));

    act(() => { result.current.addShape('circle'); });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('Circle');
  });

  it('adds a line shape layer', () => {
    const canvas = makeMockCanvas();
    const { result } = renderHook(() => useShapeTool(canvas));

    act(() => { result.current.addShape('line'); });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('Line');
  });

  it('does nothing when canvas is null', () => {
    const { result } = renderHook(() => useShapeTool(null));

    act(() => { result.current.addShape('rectangle'); });

    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it('selects the newly added shape layer', () => {
    const canvas = makeMockCanvas();
    const { result } = renderHook(() => useShapeTool(canvas));

    act(() => { result.current.addShape('rectangle'); });

    const { layers, selectedLayerId } = useLayerStore.getState();
    expect(selectedLayerId).toBe(layers[0].id);
  });
});
