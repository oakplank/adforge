import { useState, useEffect, useRef } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useCanvasManipulation } from '../hooks/useCanvasManipulation';
import { useTextTool } from '../hooks/useTextTool';
import { useCtaTool } from '../hooks/useCtaTool';
import { useImageTool } from '../hooks/useImageTool';
import { useShapeTool } from '../hooks/useShapeTool';
import { useBackgroundTool } from '../hooks/useBackgroundTool';
import { useGridOverlay } from '../hooks/useGridOverlay';
import { useFormat } from '../context/FormatContext';
import type { Canvas } from 'fabric';
import type { ShapeKind } from '../types/shapes';

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

  const { format } = useFormat();
  const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
  const shapeDropdownRef = useRef<HTMLDivElement>(null);

  const [showGrid, setShowGrid] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);

  useGridOverlay(canvas, showGrid, showSafeZones, format.id, width, height);

  useEffect(() => {
    if (canvas && onCanvasReady) {
      onCanvasReady(canvas);
    }
  }, [canvas, onCanvasReady]);

  return (
    <div className="canvas-editor-shell">
      <div className="editor-toolbar">
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

      <div className="canvas-frame shadow-2xl">
        <canvas ref={canvasRef} data-testid="fabric-canvas" />
      </div>
    </div>
  );
}
