import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageTool } from './useImageTool';
import { useLayerStore } from '../store/layerStore';

// Mock fabric
vi.mock('fabric', () => {
  const MockFabricImage = vi.fn().mockImplementation((_imgEl, opts) => ({
    type: 'image',
    ...opts,
    scale: vi.fn(),
    setControlsVisibility: vi.fn(),
    lockUniScaling: false,
  }));
  return { FabricImage: MockFabricImage };
});

describe('useImageTool', () => {
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns openFilePicker function', () => {
    const { result } = renderHook(() => useImageTool(mockCanvas));
    expect(typeof result.current.openFilePicker).toBe('function');
  });

  it('creates a file input and clicks it when openFilePicker is called', () => {
    const { result } = renderHook(() => useImageTool(mockCanvas));

    // Spy on createElement to verify input creation
    const origCreate = document.createElement.bind(document);
    let createdInput: HTMLInputElement | null = null;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, opts?: any) => {
      const el = origCreate(tag, opts);
      if (tag === 'input') {
        createdInput = el as HTMLInputElement;
        vi.spyOn(el, 'click').mockImplementation(() => {});
      }
      return el;
    });

    act(() => {
      result.current.openFilePicker();
    });

    expect(createdInput).not.toBeNull();
    expect(createdInput!.type).toBe('file');
    expect(createdInput!.accept).toBe('image/png,image/jpeg');
    expect(createdInput!.click).toHaveBeenCalled();
  });

  it('does nothing when canvas is null', () => {
    const { result } = renderHook(() => useImageTool(null));

    act(() => {
      result.current.openFilePicker();
    });

    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it('handles file selection and creates image layer', async () => {
    const { result } = renderHook(() => useImageTool(mockCanvas));

    // Intercept the created input
    const origCreate = document.createElement.bind(document);
    let fileInput: HTMLInputElement | null = null;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, opts?: any) => {
      const el = origCreate(tag, opts);
      if (tag === 'input') {
        fileInput = el as HTMLInputElement;
        vi.spyOn(el, 'click').mockImplementation(() => {});
      }
      return el;
    });

    // Mock FileReader
    let readerOnLoad: ((e: any) => void) | null = null;
    vi.spyOn(globalThis, 'FileReader').mockImplementation(() => ({
      readAsDataURL: vi.fn().mockImplementation(function() {
        readerOnLoad?.({ target: { result: 'data:image/png;base64,fake' } });
      }),
      set onload(fn: any) { readerOnLoad = fn; },
      get onload() { return readerOnLoad; },
    } as any));

    // Mock Image element
    let imgOnLoad: (() => void) | null = null;
    vi.spyOn(globalThis, 'Image').mockImplementation(() => {
      const img = {
        width: 500,
        height: 500,
        set onload(fn: any) { imgOnLoad = fn; },
        get onload() { return imgOnLoad; },
        set src(_: string) { imgOnLoad?.(); },
        get src() { return 'data:image/png;base64,fake'; },
      };
      return img as any;
    });

    act(() => {
      result.current.openFilePicker();
    });

    expect(fileInput).not.toBeNull();

    // Simulate file selection
    const mockFile = new File(['fake'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(fileInput!, 'files', { value: [mockFile], writable: false });

    act(() => {
      fileInput!.dispatchEvent(new Event('change'));
    });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].type).toBe('image');
    expect(layers[0].name).toBe('logo');
    expect(mockCanvas.add).toHaveBeenCalledTimes(1);
    expect(mockCanvas.setActiveObject).toHaveBeenCalledTimes(1);
  });

  it('selects the new image layer', async () => {
    const { result } = renderHook(() => useImageTool(mockCanvas));

    const origCreate = document.createElement.bind(document);
    let fileInput: HTMLInputElement | null = null;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, opts?: any) => {
      const el = origCreate(tag, opts);
      if (tag === 'input') {
        fileInput = el as HTMLInputElement;
        vi.spyOn(el, 'click').mockImplementation(() => {});
      }
      return el;
    });

    let readerOnLoad2: ((e: any) => void) | null = null;
    vi.spyOn(globalThis, 'FileReader').mockImplementation(() => ({
      readAsDataURL: vi.fn().mockImplementation(function() {
        readerOnLoad2?.({ target: { result: 'data:image/png;base64,fake' } });
      }),
      set onload(fn: any) { readerOnLoad2 = fn; },
      get onload() { return readerOnLoad2; },
    } as any));

    vi.spyOn(globalThis, 'Image').mockImplementation(() => {
      let imgOnLoad2: (() => void) | null = null;
      const img: any = { width: 200, height: 200 };
      Object.defineProperty(img, 'onload', {
        set: (fn: any) => { imgOnLoad2 = fn; },
        get: () => imgOnLoad2,
      });
      Object.defineProperty(img, 'src', {
        set: () => { imgOnLoad2?.(); },
      });
      return img;
    });

    act(() => { result.current.openFilePicker(); });

    const mockFile = new File(['fake'], 'product.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput!, 'files', { value: [mockFile], writable: false });

    act(() => { fileInput!.dispatchEvent(new Event('change')); });

    const { layers, selectedLayerId } = useLayerStore.getState();
    expect(selectedLayerId).toBe(layers[0].id);
  });
});
