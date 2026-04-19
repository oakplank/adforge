import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextTool } from './useTextTool';
import { useLayerStore } from '../store/layerStore';

// Mock fabric primitives. IText takes (text, opts); Shadow just stores its opts.
vi.mock('fabric', () => {
  const MockIText = vi.fn().mockImplementation((text, opts) => ({
    type: 'i-text',
    text,
    ...opts,
  }));
  const MockShadow = vi.fn().mockImplementation((opts) => ({ __shadow: true, ...opts }));
  return { IText: MockIText, Shadow: MockShadow };
});

// Mock the contrast helper so tests don't need a real rendered canvas.
vi.mock('../utils/canvasContrast', () => ({
  sampleRegionContrast: vi.fn().mockReturnValue({
    fill: '#ffffff',
    needsShadow: true,
    averageLuminance: 80,
    luminanceStdDev: 40,
  }),
}));

describe('useTextTool', () => {
  let mockCanvas: any;

  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
    mockCanvas = {
      width: 1080,
      height: 1080,
      add: vi.fn(),
      setActiveObject: vi.fn(),
      renderAll: vi.fn(),
    };
  });

  it('adds a bold headline-sized text layer in the upper third', () => {
    const { result } = renderHook(() => useTextTool(mockCanvas));

    act(() => {
      result.current.addText();
    });

    expect(mockCanvas.add).toHaveBeenCalledTimes(1);
    const textObj = mockCanvas.add.mock.calls[0][0];
    expect(textObj.text).toBe('Your headline here');
    // 7.5% of 1080 = 81 → big headline, not 48px.
    expect(textObj.fontSize).toBeGreaterThan(60);
    expect(textObj.fontWeight).toBe('bold');
    // Centered horizontally, top-biased vertically.
    expect(textObj.left).toBe(540);
    expect(textObj.top).toBeLessThan(540);
  });

  it('uses the contrast helper to pick fill + shadow', () => {
    const { result } = renderHook(() => useTextTool(mockCanvas));

    act(() => {
      result.current.addText();
    });

    const textObj = mockCanvas.add.mock.calls[0][0];
    expect(textObj.fill).toBe('#ffffff');
    expect(textObj.shadow).toBeTruthy();
    expect(textObj.shadow.__shadow).toBe(true);
  });

  it('adds layer to store as a Headline text layer', () => {
    const { result } = renderHook(() => useTextTool(mockCanvas));

    act(() => {
      result.current.addText();
    });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].type).toBe('text');
    expect(layers[0].name).toBe('Headline');
  });

  it('selects the new text layer', () => {
    const { result } = renderHook(() => useTextTool(mockCanvas));

    act(() => {
      result.current.addText();
    });

    const { layers, selectedLayerId } = useLayerStore.getState();
    expect(selectedLayerId).toBe(layers[0].id);
  });

  it('sets active object on canvas', () => {
    const { result } = renderHook(() => useTextTool(mockCanvas));

    act(() => {
      result.current.addText();
    });

    expect(mockCanvas.setActiveObject).toHaveBeenCalledTimes(1);
  });

  it('does nothing when canvas is null', () => {
    const { result } = renderHook(() => useTextTool(null));

    act(() => {
      result.current.addText();
    });

    expect(useLayerStore.getState().layers).toHaveLength(0);
  });
});
