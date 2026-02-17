import { useLayerStore } from '../store/layerStore';
import { DEFAULT_CTA_STYLE } from '../types/layers';
import type { CtaStyle } from '../types/layers';

export function CtaControls() {
  const selectedLayerId = useLayerStore((s) => s.selectedLayerId);
  const layers = useLayerStore((s) => s.layers);
  const updateCtaStyle = useLayerStore((s) => s.updateCtaStyle);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  if (!selectedLayer || selectedLayer.type !== 'cta') return null;

  const ctaStyle = selectedLayer.ctaStyle ?? DEFAULT_CTA_STYLE;

  const updateField = (field: keyof CtaStyle, value: string | number) => {
    if (!selectedLayerId) return;
    updateCtaStyle(selectedLayerId, { [field]: value });

    // Sync to fabric group
    const group = selectedLayer.fabricObject;
    if (group && typeof (group as any).getObjects === 'function') {
      const objects = (group as any).getObjects();
      const rect = objects.find((o: any) => o.type === 'rect');
      const text = objects.find((o: any) => o.type === 'i-text' || o.type === 'text');

      if (field === 'buttonColor' && rect && typeof rect.set === 'function') {
        rect.set('fill', value);
      }
      if (field === 'textContent' && text && typeof text.set === 'function') {
        text.set('text', value);
      }
      if (field === 'textColor' && text && typeof text.set === 'function') {
        text.set('fill', value);
      }
      if (field === 'cornerRadius' && rect && typeof rect.set === 'function') {
        rect.set('rx', value);
        rect.set('ry', value);
      }

      if (group.canvas && typeof group.canvas.requestRenderAll === 'function') {
        group.canvas.requestRenderAll();
      }
    }
  };

  return (
    <div className="space-y-2" data-testid="cta-controls">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">CTA Button</div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-16 shrink-0">Text</label>
        <input
          type="text"
          value={ctaStyle.textContent}
          onChange={(e) => updateField('textContent', e.target.value)}
          className="flex-1 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400"
          data-testid="cta-text-input"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-16 shrink-0">Color</label>
        <input
          type="color"
          value={ctaStyle.buttonColor}
          onChange={(e) => updateField('buttonColor', e.target.value)}
          className="w-8 h-6 rounded border border-zinc-600 cursor-pointer"
          data-testid="cta-color-input"
        />
        <span className="text-xs text-zinc-400">{ctaStyle.buttonColor}</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-400 w-16 shrink-0">Radius</label>
        <input
          type="number"
          value={ctaStyle.cornerRadius}
          onChange={(e) => updateField('cornerRadius', Number(e.target.value))}
          min={0}
          max={50}
          className="flex-1 bg-zinc-700 text-zinc-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-orange-400"
          data-testid="cta-radius-input"
        />
      </div>
    </div>
  );
}
