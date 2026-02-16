import { create } from 'zustand';
import type { Layer, LayerType, LayerTransform, TextStyle, CtaStyle } from '../types/layers';
import type { ShapeStyle, BackgroundStyle } from '../types/shapes';
import type { FabricObject } from 'fabric';

let nextId = 1;

export interface LayerStore {
  layers: Layer[];
  selectedLayerId: string | null;

  addLayer: (opts: { type: LayerType; name: string; fabricObject: FabricObject | null }) => string;
  removeLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  toggleVisibility: (id: string) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  setLayers: (layers: Layer[]) => void;
  reorderLayer: (fromIndex: number, toIndex: number) => void;
  updateLayerTransform: (id: string, transform: LayerTransform) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
  updateTextStyle: (id: string, style: Partial<TextStyle>) => void;
  updateCtaStyle: (id: string, style: Partial<CtaStyle>) => void;
  updateShapeStyle: (id: string, style: Partial<ShapeStyle>) => void;
  updateBackgroundStyle: (id: string, style: Partial<BackgroundStyle>) => void;
}

export const useLayerStore = create<LayerStore>((set, get) => ({
  layers: [],
  selectedLayerId: null,

  addLayer: ({ type, name, fabricObject }) => {
    const id = `layer-${nextId++}`;
    const layer: Layer = {
      id,
      type,
      name,
      zIndex: 0,
      visible: true,
      locked: false,
      opacity: 1,
      fabricObject,
    };
    if (type === 'background') {
      // Background always at bottom (index 0)
      set((s) => {
        const newLayers = [layer, ...s.layers];
        return { layers: newLayers.map((l, i) => ({ ...l, zIndex: i })) };
      });
    } else {
      set((s) => {
        const newLayers = [...s.layers, layer];
        return { layers: newLayers.map((l, i) => ({ ...l, zIndex: i })) };
      });
    }
    return id;
  },

  removeLayer: (id) => {
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== id),
      selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
    }));
  },

  selectLayer: (id) => {
    set({ selectedLayerId: id });
  },

  toggleVisibility: (id) => {
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    }));
  },

  moveLayer: (id, direction) => {
    const { layers } = get();
    const layer = layers.find((l) => l.id === id);
    if (!layer || layer.type === 'background') return; // background stays at bottom
    const idx = layers.indexOf(layer);
    const newIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= layers.length) return;
    // Don't swap with background layer
    if (layers[newIdx].type === 'background') return;
    const newLayers = [...layers];
    [newLayers[idx], newLayers[newIdx]] = [newLayers[newIdx], newLayers[idx]];
    set({ layers: newLayers.map((l, i) => ({ ...l, zIndex: i })) });
  },

  reorderLayer: (fromIndex, toIndex) => {
    const { layers } = get();
    if (fromIndex < 0 || fromIndex >= layers.length || toIndex < 0 || toIndex >= layers.length) return;
    const newLayers = [...layers];
    const [moved] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, moved);
    set({ layers: newLayers.map((l, i) => ({ ...l, zIndex: i })) });
  },

  setLayers: (layers) => set({ layers }),

  updateLayerTransform: (id, transform) => {
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, transform } : l
      ),
    }));
  },

  updateLayerOpacity: (id, opacity) => {
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
      ),
    }));
  },

  updateTextStyle: (id, style) => {
    set((s) => ({
      layers: s.layers.map((l) => {
        if (l.id !== id) return l;
        const current = l.textStyle ?? {
          fontFamily: 'Space Grotesk', fontSize: 48, fill: '#ffffff',
          fontWeight: 'normal' as const, fontStyle: 'normal' as const,
          underline: false, textAlign: 'left' as const, shadow: null,
        };
        return { ...l, textStyle: { ...current, ...style } };
      }),
    }));
  },

  updateCtaStyle: (id, style) => {
    set((s) => ({
      layers: s.layers.map((l) => {
        if (l.id !== id) return l;
        const current = l.ctaStyle ?? {
          buttonColor: '#ff6a3d', textContent: 'Shop Now', textColor: '#ffffff',
          cornerRadius: 8, paddingX: 32, paddingY: 12,
        };
        return { ...l, ctaStyle: { ...current, ...style } };
      }),
    }));
  },

  updateShapeStyle: (id, style) => {
    set((s) => ({
      layers: s.layers.map((l) => {
        if (l.id !== id) return l;
        const current = l.shapeStyle ?? {
          fill: '#ff6a3d', stroke: '#000000', strokeWidth: 0, cornerRadius: 0,
        };
        return { ...l, shapeStyle: { ...current, ...style } };
      }),
    }));
  },

  updateBackgroundStyle: (id, style) => {
    set((s) => ({
      layers: s.layers.map((l) => {
        if (l.id !== id) return l;
        const current = l.backgroundStyle ?? { type: 'solid' as const, color: '#121821' };
        return { ...l, backgroundStyle: { ...current, ...style } };
      }),
    }));
  },
}));
