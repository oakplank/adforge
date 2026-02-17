import { useEffect, useCallback } from 'react';
import { useLayerStore } from '../store/layerStore';
import { useHistoryStore } from '../store/historyStore';
import type { Layer } from '../types/layers';

function stripFabricObjects(layers: Layer[]): Layer[] {
  return layers.map((l) => ({ ...l, fabricObject: null }));
}

export function useKeyboardShortcuts() {
  const historyStore = useHistoryStore();

  const saveState = useCallback(() => {
    const { layers, selectedLayerId } = useLayerStore.getState();
    historyStore.pushState({
      layers: stripFabricObjects(layers),
      selectedLayerId,
    });
  }, [historyStore]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't intercept when typing in inputs
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd+Z / Cmd+Shift+Z — undo/redo
      if (isMeta && e.key === 'z') {
        e.preventDefault();
        const { layers, selectedLayerId } = useLayerStore.getState();
        const current = { layers: stripFabricObjects(layers), selectedLayerId };

        if (e.shiftKey) {
          const entry = useHistoryStore.getState().redo(current);
          if (entry) {
            useLayerStore.getState().setLayers(entry.layers);
            useLayerStore.getState().selectLayer(entry.selectedLayerId);
          }
        } else {
          const entry = useHistoryStore.getState().undo(current);
          if (entry) {
            useLayerStore.getState().setLayers(entry.layers);
            useLayerStore.getState().selectLayer(entry.selectedLayerId);
          }
        }
        return;
      }

      // Cmd+D — duplicate
      if (isMeta && e.key === 'd') {
        e.preventDefault();
        const { selectedLayerId, layers } = useLayerStore.getState();
        if (!selectedLayerId) return;
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (!layer) return;
        saveState();
        useLayerStore.getState().addLayer({
          type: layer.type,
          name: `${layer.name} copy`,
          fabricObject: null,
        });
        return;
      }

      // Cmd+A — select all (no-op for now, prevent default)
      if (isMeta && e.key === 'a') {
        e.preventDefault();
        return;
      }

      // Delete/Backspace — remove selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedLayerId } = useLayerStore.getState();
        if (!selectedLayerId) return;
        e.preventDefault();
        saveState();
        useLayerStore.getState().removeLayer(selectedLayerId);
        return;
      }
    },
    [saveState]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { saveState };
}
