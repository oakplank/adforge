import { useEffect, useCallback } from 'react';
import type { Canvas, FabricObject } from 'fabric';
import { useLayerStore } from '../store/layerStore';
import type { LayerTransform } from '../types/layers';

const SNAP_THRESHOLD = 8;

function getTransformFromObject(obj: FabricObject): LayerTransform {
  return {
    left: obj.left ?? 0,
    top: obj.top ?? 0,
    width: obj.width ?? 0,
    height: obj.height ?? 0,
    scaleX: obj.scaleX ?? 1,
    scaleY: obj.scaleY ?? 1,
    angle: obj.angle ?? 0,
  };
}

function findLayerIdForObject(obj: FabricObject): string | null {
  const layers = useLayerStore.getState().layers;
  const layer = layers.find((l) => l.fabricObject === obj);
  return layer?.id ?? null;
}

export function useCanvasManipulation(canvas: Canvas | null) {
  const updateLayerTransform = useLayerStore((s) => s.updateLayerTransform);
  const selectLayer = useLayerStore((s) => s.selectLayer);

  const configureCanvas = useCallback((c: Canvas) => {
    // Dark theme selection styling
    c.selectionColor = 'rgba(59, 130, 246, 0.15)';
    c.selectionBorderColor = '#3b82f6';
    c.selectionLineWidth = 1;
  }, []);

  const configureObject = useCallback((obj: FabricObject) => {
    obj.set({
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#1e3a5f',
      cornerSize: 10,
      cornerStyle: 'circle',
      borderColor: '#3b82f6',
      borderScaleFactor: 2,
      transparentCorners: false,
      padding: 4,
    });
  }, []);

  const syncTransform = useCallback((obj: FabricObject) => {
    const layerId = findLayerIdForObject(obj);
    if (layerId) {
      updateLayerTransform(layerId, getTransformFromObject(obj));
    }
  }, [updateLayerTransform]);

  const applySnapping = useCallback((obj: FabricObject, c: Canvas) => {
    const centerX = (c.width ?? 0) / 2;
    const centerY = (c.height ?? 0) / 2;
    
    const objCenterX = (obj.left ?? 0) + ((obj.width ?? 0) * (obj.scaleX ?? 1)) / 2;
    const objCenterY = (obj.top ?? 0) + ((obj.height ?? 0) * (obj.scaleY ?? 1)) / 2;

    let snappedX = false;
    let snappedY = false;

    if (Math.abs(objCenterX - centerX) < SNAP_THRESHOLD) {
      obj.set('left', centerX - ((obj.width ?? 0) * (obj.scaleX ?? 1)) / 2);
      snappedX = true;
    }

    if (Math.abs(objCenterY - centerY) < SNAP_THRESHOLD) {
      obj.set('top', centerY - ((obj.height ?? 0) * (obj.scaleY ?? 1)) / 2);
      snappedY = true;
    }

    return { snappedX, snappedY };
  }, []);

  useEffect(() => {
    if (!canvas) return;

    configureCanvas(canvas);

    // Configure existing objects
    if (typeof canvas.getObjects === 'function') {
      canvas.getObjects().forEach(configureObject);
    }

    const onObjectAdded = (e: { target: FabricObject }) => {
      configureObject(e.target);
    };

    const onObjectMoving = (e: { target: FabricObject }) => {
      applySnapping(e.target, canvas);
    };

    const onObjectModified = (e: { target: FabricObject }) => {
      syncTransform(e.target);
    };

    const onSelectionCreated = (e: { selected: FabricObject[] }) => {
      if (e.selected.length === 1) {
        const layerId = findLayerIdForObject(e.selected[0]);
        if (layerId) selectLayer(layerId);
      }
    };

    const onSelectionCleared = () => {
      selectLayer(null);
    };

    if (typeof canvas.on !== 'function') return;

    canvas.on('object:added', onObjectAdded as any);
    canvas.on('object:moving', onObjectMoving as any);
    canvas.on('object:modified', onObjectModified as any);
    canvas.on('selection:created', onSelectionCreated as any);
    canvas.on('selection:updated', onSelectionCreated as any);
    canvas.on('selection:cleared', onSelectionCleared);

    return () => {
      canvas.off('object:added', onObjectAdded as any);
      canvas.off('object:moving', onObjectMoving as any);
      canvas.off('object:modified', onObjectModified as any);
      canvas.off('selection:created', onSelectionCreated as any);
      canvas.off('selection:updated', onSelectionCreated as any);
      canvas.off('selection:cleared', onSelectionCleared);
    };
  }, [canvas, configureCanvas, configureObject, syncTransform, applySnapping, selectLayer]);

  return { configureObject };
}

export { getTransformFromObject, findLayerIdForObject, SNAP_THRESHOLD };
