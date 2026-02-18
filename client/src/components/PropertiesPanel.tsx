import { useCallback, useState } from 'react';
import { useLayerStore } from '../store/layerStore';
import type { LayerTransform } from '../types/layers';
import { TypographyControls } from './TypographyControls';
import { CtaControls } from './CtaControls';
import { ShapeControls } from './ShapeControls';
import { BackgroundControls } from './BackgroundControls';

function PropertyField({ label, value, onChange, min, max, step = 1 }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-zinc-400 w-8 shrink-0">{label}</label>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex-1 text-zinc-100 text-xs rounded px-2 py-1 outline-none border border-white/10 bg-white/[0.05] focus:ring-1 focus:ring-indigo-400"
        data-testid={`prop-${label.toLowerCase()}`}
      />
    </div>
  );
}

function ImageControls({ layer }: { layer: { fabricObject: any } }) {
  const [aspectLocked, setAspectLocked] = useState(true);

  const toggleAspectLock = useCallback(() => {
    const newLocked = !aspectLocked;
    setAspectLocked(newLocked);
    const obj = layer.fabricObject;
    if (obj && typeof obj.setControlsVisibility === 'function') {
      if (newLocked) {
        obj.setControlsVisibility({ mb: false, mt: false, ml: false, mr: false });
        obj.lockUniScaling = true;
      } else {
        obj.setControlsVisibility({ mb: true, mt: true, ml: true, mr: true });
        obj.lockUniScaling = false;
      }
      if (obj.canvas && typeof obj.canvas.requestRenderAll === 'function') {
        obj.canvas.requestRenderAll();
      }
    }
  }, [aspectLocked, layer.fabricObject]);

  return (
    <div className="space-y-2" data-testid="image-controls">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">Image</div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400">Aspect Ratio Lock</label>
        <button
          data-testid="aspect-ratio-toggle"
          onClick={toggleAspectLock}
          className={`px-2 py-0.5 text-xs rounded ${aspectLocked ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-700 text-zinc-400'}`}
        >
          {aspectLocked ? '🔒 Locked' : '🔓 Unlocked'}
        </button>
      </div>
    </div>
  );
}

export function PropertiesPanel() {
  const selectedLayerId = useLayerStore((s) => s.selectedLayerId);
  const layers = useLayerStore((s) => s.layers);
  const updateLayerTransform = useLayerStore((s) => s.updateLayerTransform);
  const updateLayerOpacity = useLayerStore((s) => s.updateLayerOpacity);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const transform = selectedLayer?.transform ?? {
    left: 0, top: 0, width: 0, height: 0, scaleX: 1, scaleY: 1, angle: 0,
  };
  const opacity = selectedLayer?.opacity ?? 1;

  const updateTransformField = useCallback((field: keyof LayerTransform, value: number) => {
    if (!selectedLayerId || !selectedLayer) return;
    const newTransform = { ...transform, [field]: value };
    updateLayerTransform(selectedLayerId, newTransform);

    // Sync to fabric object
    const obj = selectedLayer.fabricObject;
    if (obj && typeof obj.set === 'function') {
      obj.set(field, value);
      if (obj.canvas && typeof obj.canvas.requestRenderAll === 'function') {
        obj.canvas.requestRenderAll();
      }
    }
  }, [selectedLayerId, selectedLayer, transform, updateLayerTransform]);

  const handleOpacityChange = useCallback((value: number) => {
    if (!selectedLayerId || !selectedLayer) return;
    updateLayerOpacity(selectedLayerId, value);

    const obj = selectedLayer.fabricObject;
    if (obj && typeof obj.set === 'function') {
      obj.set('opacity', value);
      if (obj.canvas && typeof obj.canvas.requestRenderAll === 'function') {
        obj.canvas.requestRenderAll();
      }
    }
  }, [selectedLayerId, selectedLayer, updateLayerOpacity]);

  if (!selectedLayer) {
    return (
      <div className="p-3 text-xs text-zinc-500" data-testid="no-selection-message">
        Select a layer to edit properties
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3" data-testid="properties-fields">
      <div className="props-layer-title">{selectedLayer.name}</div>

      <div className="props-section">
        <div className="props-section-title">Position</div>
        <div className="grid grid-cols-2 gap-2">
          <PropertyField label="X" value={transform.left} onChange={(v) => updateTransformField('left', v)} />
          <PropertyField label="Y" value={transform.top} onChange={(v) => updateTransformField('top', v)} />
        </div>
      </div>

      <div className="props-section">
        <div className="props-section-title">Size</div>
        <div className="grid grid-cols-2 gap-2">
          <PropertyField label="W" value={transform.width * transform.scaleX} onChange={(v) => {
            if (transform.width > 0) updateTransformField('scaleX', v / transform.width);
          }} min={0} />
          <PropertyField label="H" value={transform.height * transform.scaleY} onChange={(v) => {
            if (transform.height > 0) updateTransformField('scaleY', v / transform.height);
          }} min={0} />
        </div>
      </div>

      <div className="props-section">
        <div className="props-section-title">Rotation</div>
        <PropertyField label="°" value={transform.angle} onChange={(v) => updateTransformField('angle', v)} step={1} />
      </div>

      <TypographyControls />
      {selectedLayer.type === 'cta' && <CtaControls />}
      {selectedLayer.type === 'shape' && <ShapeControls />}
      {selectedLayer.type === 'background' && <BackgroundControls canvas={null} />}

      {selectedLayer.type === 'image' && <ImageControls layer={selectedLayer} />}

      <div className="props-section">
        <div className="props-section-title">Opacity</div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={opacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
            className="flex-1"
            data-testid="prop-opacity"
          />
          <span className="text-xs text-zinc-400 w-8 text-right">{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
