import { describe, it, expect, beforeEach } from 'vitest';
import { useLayerStore } from '../store/layerStore';
import { getTransformFromObject, SNAP_THRESHOLD } from './useCanvasManipulation';

// Reset store between tests
beforeEach(() => {
  useLayerStore.setState({ layers: [], selectedLayerId: null });
});

describe('getTransformFromObject', () => {
  it('extracts transform from a fabric-like object', () => {
    const obj = { left: 10, top: 20, width: 100, height: 50, scaleX: 1.5, scaleY: 2, angle: 45 } as any;
    const t = getTransformFromObject(obj);
    expect(t).toEqual({ left: 10, top: 20, width: 100, height: 50, scaleX: 1.5, scaleY: 2, angle: 45 });
  });

  it('defaults undefined values to 0/1', () => {
    const obj = {} as any;
    const t = getTransformFromObject(obj);
    expect(t).toEqual({ left: 0, top: 0, width: 0, height: 0, scaleX: 1, scaleY: 1, angle: 0 });
  });
});

describe('updateLayerTransform', () => {
  it('updates transform for a layer by id', () => {
    const store = useLayerStore.getState();
    const fakeObj = {} as any;
    const id = store.addLayer({ type: 'shape', name: 'Rect', fabricObject: fakeObj });

    const transform = { left: 50, top: 60, width: 200, height: 100, scaleX: 1, scaleY: 1, angle: 30 };
    useLayerStore.getState().updateLayerTransform(id, transform);

    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer?.transform).toEqual(transform);
  });

  it('does not affect other layers', () => {
    const store = useLayerStore.getState();
    const id1 = store.addLayer({ type: 'shape', name: 'A', fabricObject: {} as any });
    const id2 = store.addLayer({ type: 'text', name: 'B', fabricObject: {} as any });

    const transform = { left: 10, top: 10, width: 50, height: 50, scaleX: 1, scaleY: 1, angle: 0 };
    useLayerStore.getState().updateLayerTransform(id1, transform);

    const layer2 = useLayerStore.getState().layers.find((l) => l.id === id2);
    expect(layer2?.transform).toBeUndefined();
  });
});

describe('snap threshold', () => {
  it('is 8 pixels', () => {
    expect(SNAP_THRESHOLD).toBe(8);
  });
});

describe('object manipulation sync', () => {
  it('moving an object updates position in the layer store', () => {
    const store = useLayerStore.getState();
    const fakeObj = { left: 0, top: 0, width: 100, height: 100, scaleX: 1, scaleY: 1, angle: 0 } as any;
    const id = store.addLayer({ type: 'shape', name: 'Box', fabricObject: fakeObj });

    // Simulate moving: update obj position, then sync
    fakeObj.left = 200;
    fakeObj.top = 150;
    useLayerStore.getState().updateLayerTransform(id, getTransformFromObject(fakeObj));

    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer?.transform?.left).toBe(200);
    expect(layer?.transform?.top).toBe(150);
  });

  it('resizing an object updates scale in the layer store', () => {
    const store = useLayerStore.getState();
    const fakeObj = { left: 0, top: 0, width: 100, height: 100, scaleX: 1, scaleY: 1, angle: 0 } as any;
    const id = store.addLayer({ type: 'shape', name: 'Box', fabricObject: fakeObj });

    fakeObj.scaleX = 2;
    fakeObj.scaleY = 1.5;
    useLayerStore.getState().updateLayerTransform(id, getTransformFromObject(fakeObj));

    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer?.transform?.scaleX).toBe(2);
    expect(layer?.transform?.scaleY).toBe(1.5);
  });

  it('rotating an object updates angle in the layer store', () => {
    const store = useLayerStore.getState();
    const fakeObj = { left: 0, top: 0, width: 100, height: 100, scaleX: 1, scaleY: 1, angle: 0 } as any;
    const id = store.addLayer({ type: 'shape', name: 'Box', fabricObject: fakeObj });

    fakeObj.angle = 90;
    useLayerStore.getState().updateLayerTransform(id, getTransformFromObject(fakeObj));

    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer?.transform?.angle).toBe(90);
  });
});
