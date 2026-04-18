import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCtaTool } from './useCtaTool';
import { useLayerStore } from '../store/layerStore';

// Mock fabric
vi.mock('fabric', () => {
  class MockRect {
    type = 'rect';
    constructor(public opts: any) {}
  }
  class MockIText {
    type = 'i-text';
    width = 100;
    height = 30;
    constructor(public text: string, public opts: any) {}
  }
  class MockGroup {
    type = 'group';
    canvas: any = null;
    constructor(public objects: any[], public opts: any) {}
    getObjects() { return this.objects; }
  }
  return {
    Rect: MockRect,
    IText: MockIText,
    Group: MockGroup,
  };
});

describe('useCtaTool', () => {
  const mockCanvas = {
    add: vi.fn(),
    setActiveObject: vi.fn(),
    renderAll: vi.fn(),
    width: 1080,
    height: 1080,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('adds a CTA layer to the store', () => {
    const { result } = renderHook(() => useCtaTool(mockCanvas as any));
    act(() => result.current.addCta());

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].type).toBe('cta');
    expect(layers[0].name).toBe('CTA Button');
  });

  it('adds a group to the canvas', () => {
    const { result } = renderHook(() => useCtaTool(mockCanvas as any));
    act(() => result.current.addCta());

    expect(mockCanvas.add).toHaveBeenCalledTimes(1);
    const group = mockCanvas.add.mock.calls[0][0];
    expect(group.type).toBe('group');
  });

  it('creates group with rect and text objects', () => {
    const { result } = renderHook(() => useCtaTool(mockCanvas as any));
    act(() => result.current.addCta());

    const group = mockCanvas.add.mock.calls[0][0];
    const objects = group.objects;
    expect(objects).toHaveLength(2);
    expect(objects[0].type).toBe('rect');
    expect(objects[1].type).toBe('i-text');
  });

  it('selects the new CTA layer', () => {
    const { result } = renderHook(() => useCtaTool(mockCanvas as any));
    act(() => result.current.addCta());

    const { selectedLayerId, layers } = useLayerStore.getState();
    expect(selectedLayerId).toBe(layers[0].id);
  });

  it('does nothing when canvas is null', () => {
    const { result } = renderHook(() => useCtaTool(null));
    act(() => result.current.addCta());

    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it('sets default button color on rect', () => {
    const { result } = renderHook(() => useCtaTool(mockCanvas as any));
    act(() => result.current.addCta());

    const group = mockCanvas.add.mock.calls[0][0];
    const rect = group.objects[0];
    expect(rect.opts.fill).toBe('#ff6a3d');
  });

  it('sets default corner radius on rect', () => {
    const { result } = renderHook(() => useCtaTool(mockCanvas as any));
    act(() => result.current.addCta());

    const group = mockCanvas.add.mock.calls[0][0];
    const rect = group.objects[0];
    expect(rect.opts.rx).toBe(8);
    expect(rect.opts.ry).toBe(8);
  });

  it('sets default text content', () => {
    const { result } = renderHook(() => useCtaTool(mockCanvas as any));
    act(() => result.current.addCta());

    const group = mockCanvas.add.mock.calls[0][0];
    const text = group.objects[1];
    expect(text.text).toBe('Shop Now');
  });
});
