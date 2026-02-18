import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextTool } from './useTextTool';
import { useLayerStore } from '../store/layerStore';

// Mock fabric
vi.mock('fabric', () => {
  const MockIText = vi.fn().mockImplementation((text, opts) => ({
    type: 'i-text',
    text,
    ...opts,
  }));
  return { IText: MockIText };
});

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

  it('adds a text layer with default properties', () => {
    const { result } = renderHook(() => useTextTool(mockCanvas));

    act(() => {
      result.current.addText();
    });

    // Check canvas received the object
    expect(mockCanvas.add).toHaveBeenCalledTimes(1);
    const textObj = mockCanvas.add.mock.calls[0][0];
    expect(textObj.text).toBe('Your Text Here');
    expect(textObj.fill).toBe('#ffffff');
    expect(textObj.fontSize).toBe(48);
    expect(textObj.left).toBe(540); // centered
    expect(textObj.top).toBe(540);
  });

  it('adds layer to store with type text and name Text', () => {
    const { result } = renderHook(() => useTextTool(mockCanvas));

    act(() => {
      result.current.addText();
    });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].type).toBe('text');
    expect(layers[0].name).toBe('Text');
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

  it('IText supports inline editing by default (double-click)', async () => {
    // IText in Fabric.js natively supports double-click to edit
    // We verify we're using IText (not Text) by checking the mock was called
    const { IText } = await import('fabric');
    const { result } = renderHook(() => useTextTool(mockCanvas));

    act(() => {
      result.current.addText();
    });

    expect(IText).toHaveBeenCalledWith('Your Text Here', expect.objectContaining({
      fontSize: 48,
      fill: '#ffffff',
    }));
  });
});
