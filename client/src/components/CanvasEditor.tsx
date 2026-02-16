import { useState, useEffect, useRef, useCallback } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useCanvasManipulation } from '../hooks/useCanvasManipulation';
import { useTextTool } from '../hooks/useTextTool';
import { useCtaTool } from '../hooks/useCtaTool';
import { useImageTool } from '../hooks/useImageTool';
import { useShapeTool } from '../hooks/useShapeTool';
import { useBackgroundTool } from '../hooks/useBackgroundTool';
import { useGridOverlay } from '../hooks/useGridOverlay';
import { useFormat } from '../context/FormatContext';
import { useLayerStore } from '../store/layerStore';
import { useHistoryStore } from '../store/historyStore';
import type { Canvas } from 'fabric';
import type { ShapeKind } from '../types/shapes';
import type { Layer } from '../types/layers';

export interface CanvasEditorProps {
  width?: number;
  height?: number;
  onCanvasReady?: (canvas: Canvas) => void;
}

export function CanvasEditor({ width = 1080, height = 1080, onCanvasReady }: CanvasEditorProps) {
  const { canvasRef, canvas } = useCanvas({ width, height });
  useCanvasManipulation(canvas);

  const { addText } = useTextTool(canvas);
  const { addCta } = useCtaTool(canvas);
  const { openFilePicker } = useImageTool(canvas);
  const { addShape } = useShapeTool(canvas);
  const { addBackground } = useBackgroundTool(canvas);
  const selectedLayerId = useLayerStore((s) => s.selectedLayerId);
  const layers = useLayerStore((s) => s.layers);
  const addLayer = useLayerStore((s) => s.addLayer);
  const removeLayer = useLayerStore((s) => s.removeLayer);
  const selectLayer = useLayerStore((s) => s.selectLayer);
  const moveLayer = useLayerStore((s) => s.moveLayer);
  const historyStore = useHistoryStore();

  const { format } = useFormat();
  const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
  const shapeDropdownRef = useRef<HTMLDivElement>(null);

  const [showGrid, setShowGrid] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ width, height });

  useGridOverlay(canvas, showGrid, showSafeZones, format.id, width, height);

  const saveHistory = useCallback(() => {
    const snapshot: Layer[] = useLayerStore
      .getState()
      .layers
      .map((layer) => ({ ...layer, fabricObject: null }));
    historyStore.pushState({
      layers: snapshot,
      selectedLayerId: useLayerStore.getState().selectedLayerId,
    });
  }, [historyStore]);

  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedLayerId) return;
    saveHistory();
    const layer = useLayerStore.getState().layers.find((entry) => entry.id === selectedLayerId);
    if (canvas && layer?.fabricObject && typeof canvas.remove === 'function') {
      canvas.remove(layer.fabricObject);
      canvas.requestRenderAll?.();
    }
    removeLayer(selectedLayerId);
  }, [canvas, selectedLayerId, removeLayer, saveHistory]);

  const handleDuplicateSelected = useCallback(async () => {
    if (!canvas || !selectedLayerId) return;
    const layer = useLayerStore.getState().layers.find((entry) => entry.id === selectedLayerId);
    if (!layer?.fabricObject || typeof (layer.fabricObject as any).clone !== 'function') return;

    saveHistory();
    const cloned = await (layer.fabricObject as any).clone();
    const nextLeft = (cloned.left ?? 0) + 28;
    const nextTop = (cloned.top ?? 0) + 28;
    cloned.set({
      left: nextLeft,
      top: nextTop,
    });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.requestRenderAll?.();

    const nextLayerId = addLayer({
      type: layer.type,
      name: `${layer.name} copy`,
      fabricObject: cloned,
    });
    selectLayer(nextLayerId);
  }, [addLayer, canvas, selectedLayerId, selectLayer, saveHistory]);

  const handleLayerNudge = useCallback((direction: 'up' | 'down') => {
    if (!canvas || !selectedLayerId) return;
    const layer = useLayerStore.getState().layers.find((entry) => entry.id === selectedLayerId);
    if (!layer?.fabricObject) return;
    saveHistory();
    moveLayer(selectedLayerId, direction);
    if (direction === 'up') {
      canvas.bringObjectForward?.(layer.fabricObject);
    } else {
      canvas.sendObjectBackwards?.(layer.fabricObject);
    }
    canvas.requestRenderAll?.();
  }, [canvas, moveLayer, selectedLayerId, saveHistory]);

  const applyResponsiveCanvasSize = useCallback(() => {
    if (!canvas || !viewportRef.current) return;

    const bounds = viewportRef.current.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const availableW = Math.max(120, bounds.width - 24);
    const availableH = Math.max(120, bounds.height - 24);
    const scale = Math.min(availableW / width, availableH / height);
    const safeScale = Number.isFinite(scale) ? Math.max(0.2, Math.min(2, scale)) : 1;

    const nextWidth = Math.round(width * safeScale);
    const nextHeight = Math.round(height * safeScale);

    if (typeof canvas.setDimensions === 'function') {
      canvas.setDimensions({ width: nextWidth, height: nextHeight }, { cssOnly: true });
    }
    if (typeof canvas.calcOffset === 'function') {
      canvas.calcOffset();
    }
    if (typeof canvas.requestRenderAll === 'function') {
      canvas.requestRenderAll();
    }
    setDisplaySize({ width: nextWidth, height: nextHeight });
  }, [canvas, width, height]);

  useEffect(() => {
    if (canvas && onCanvasReady) {
      onCanvasReady(canvas);
    }
  }, [canvas, onCanvasReady]);

  useEffect(() => {
    applyResponsiveCanvasSize();
  }, [applyResponsiveCanvasSize, width, height]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => applyResponsiveCanvasSize());
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener('resize', applyResponsiveCanvasSize);
    return () => window.removeEventListener('resize', applyResponsiveCanvasSize);
  }, [applyResponsiveCanvasSize]);

  return (
    <div className="canvas-editor-shell">
      <div className="editor-toolbar">
        <span className="editor-toolbar-label">Add Elements</span>

        <button data-testid="add-text-button" onClick={addText} className="editor-toolbar-button">
          Text
        </button>

        <button data-testid="add-cta-button" onClick={addCta} className="editor-toolbar-button">
          CTA
        </button>

        <button data-testid="add-image-button" onClick={openFilePicker} className="editor-toolbar-button">
          Image
        </button>

        <div className="relative" ref={shapeDropdownRef}>
          <button
            data-testid="add-shape-button"
            onClick={() => setShapeDropdownOpen((value) => !value)}
            className="editor-toolbar-button"
          >
            Shape
          </button>

          {shapeDropdownOpen && (
            <div className="editor-dropdown" data-testid="shape-dropdown">
              {(['rectangle', 'circle', 'line'] as ShapeKind[]).map((kind) => (
                <button
                  key={kind}
                  data-testid={`add-shape-${kind}`}
                  onClick={() => {
                    addShape(kind);
                    setShapeDropdownOpen(false);
                  }}
                  className="editor-dropdown-item"
                >
                  {kind}
                </button>
              ))}
            </div>
          )}
        </div>

        <button data-testid="add-background-button" onClick={addBackground} className="editor-toolbar-button">
          Backdrop
        </button>

        <button
          data-testid="toggle-grid-button"
          onClick={() => setShowGrid((value) => !value)}
          className={`editor-toolbar-button ${showGrid ? 'editor-toggle-active' : ''}`}
        >
          Grid
        </button>

        <button
          data-testid="toggle-safe-zones-button"
          onClick={() => setShowSafeZones((value) => !value)}
          className={`editor-toolbar-button ${showSafeZones ? 'editor-toggle-active' : ''}`}
        >
          Safe Zones
        </button>
      </div>

      <div className="canvas-viewport" ref={viewportRef}>
        <div className="canvas-tool-rail" aria-label="Canvas tools">
          <button type="button" className="canvas-rail-button" onClick={addText} title="Add Text">
            Tx
          </button>
          <button type="button" className="canvas-rail-button" onClick={openFilePicker} title="Add Image">
            Im
          </button>
          <button type="button" className="canvas-rail-button" onClick={() => addShape('rectangle')} title="Add Rectangle">
            Re
          </button>
          <button type="button" className="canvas-rail-button" onClick={() => addShape('circle')} title="Add Circle">
            Ci
          </button>
          <button type="button" className="canvas-rail-button" onClick={addBackground} title="Add Backdrop">
            Bg
          </button>
        </div>

        {selectedLayer && (
          <div className="canvas-float-actions" aria-label="Selection actions">
            <button type="button" className="canvas-float-button" onClick={handleDuplicateSelected}>
              Duplicate
            </button>
            <button type="button" className="canvas-float-button" onClick={() => handleLayerNudge('up')}>
              Bring Forward
            </button>
            <button type="button" className="canvas-float-button" onClick={() => handleLayerNudge('down')}>
              Send Back
            </button>
            <button type="button" className="canvas-float-button danger" onClick={handleDeleteSelected}>
              Delete
            </button>
          </div>
        )}

        <div
          className="canvas-frame shadow-2xl"
          style={{
            width: `${displaySize.width + 24}px`,
            height: `${displaySize.height + 24}px`,
          }}
        >
          <canvas ref={canvasRef} data-testid="fabric-canvas" />
        </div>
      </div>
    </div>
  );
}
