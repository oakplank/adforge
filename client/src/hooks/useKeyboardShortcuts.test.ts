import { describe, it, expect, beforeEach } from 'vitest';
import { useLayerStore } from '../store/layerStore';
import { useHistoryStore } from '../store/historyStore';

// Minimal inline version of the handler for unit testing
function handleKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

  const isMeta = e.metaKey || e.ctrlKey;

  if (isMeta && e.key === 'z') {
    const { layers, selectedLayerId } = useLayerStore.getState();
    const current = { layers: layers.map(l => ({ ...l, fabricObject: null })), selectedLayerId };
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

  if (isMeta && e.key === 'y') {
    const { layers, selectedLayerId } = useLayerStore.getState();
    const current = { layers: layers.map(l => ({ ...l, fabricObject: null })), selectedLayerId };
    const entry = useHistoryStore.getState().redo(current);
    if (entry) {
      useLayerStore.getState().setLayers(entry.layers);
      useLayerStore.getState().selectLayer(entry.selectedLayerId);
    }
    return;
  }

  if (isMeta && e.key === 'd') {
    const { selectedLayerId, layers } = useLayerStore.getState();
    if (!selectedLayerId) return;
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer) return;
    const { layers: cur, selectedLayerId: sel } = useLayerStore.getState();
    useHistoryStore.getState().pushState({ layers: cur.map(l => ({ ...l, fabricObject: null })), selectedLayerId: sel });
    useLayerStore.getState().addLayer({ type: layer.type, name: `${layer.name} copy`, fabricObject: null });
    return;
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    const { selectedLayerId } = useLayerStore.getState();
    if (!selectedLayerId) return;
    const { layers: cur, selectedLayerId: sel } = useLayerStore.getState();
    useHistoryStore.getState().pushState({ layers: cur.map(l => ({ ...l, fabricObject: null })), selectedLayerId: sel });
    useLayerStore.getState().removeLayer(selectedLayerId);
    return;
  }
}

describe('keyboard shortcuts', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
    useHistoryStore.setState({ past: [], future: [], maxHistory: 50 });
  });

  it('Delete removes selected layer', () => {
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Test', fabricObject: null });
    useLayerStore.getState().selectLayer(id);

    handleKeyDown(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it('Backspace removes selected layer', () => {
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Test', fabricObject: null });
    useLayerStore.getState().selectLayer(id);

    handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it('Delete does nothing without selection', () => {
    useLayerStore.getState().addLayer({ type: 'text', name: 'Test', fabricObject: null });
    handleKeyDown(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(useLayerStore.getState().layers).toHaveLength(1);
  });

  it('Cmd+D duplicates selected layer', () => {
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Headline', fabricObject: null });
    useLayerStore.getState().selectLayer(id);

    handleKeyDown(new KeyboardEvent('keydown', { key: 'd', metaKey: true }));
    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(2);
    expect(layers[1].name).toBe('Headline copy');
  });

  it('Cmd+Z undoes last action', () => {
    // Add a layer and save state before removing
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Keep', fabricObject: null });
    useLayerStore.getState().selectLayer(id);

    // Push current state, then remove
    const { layers, selectedLayerId } = useLayerStore.getState();
    useHistoryStore.getState().pushState({ layers: layers.map(l => ({ ...l, fabricObject: null })), selectedLayerId });
    useLayerStore.getState().removeLayer(id);
    expect(useLayerStore.getState().layers).toHaveLength(0);

    // Undo
    handleKeyDown(new KeyboardEvent('keydown', { key: 'z', metaKey: true }));
    expect(useLayerStore.getState().layers).toHaveLength(1);
    expect(useLayerStore.getState().layers[0].name).toBe('Keep');
  });

  it('Cmd+Shift+Z redoes undone action', () => {
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Keep', fabricObject: null });
    useLayerStore.getState().selectLayer(id);

    const { layers, selectedLayerId } = useLayerStore.getState();
    useHistoryStore.getState().pushState({ layers: layers.map(l => ({ ...l, fabricObject: null })), selectedLayerId });
    useLayerStore.getState().removeLayer(id);

    // Undo
    handleKeyDown(new KeyboardEvent('keydown', { key: 'z', metaKey: true }));
    expect(useLayerStore.getState().layers).toHaveLength(1);

    // Redo
    handleKeyDown(new KeyboardEvent('keydown', { key: 'z', metaKey: true, shiftKey: true }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it('Ctrl+Y redoes undone action', () => {
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Keep', fabricObject: null });
    useLayerStore.getState().selectLayer(id);

    const { layers, selectedLayerId } = useLayerStore.getState();
    useHistoryStore.getState().pushState({ layers: layers.map(l => ({ ...l, fabricObject: null })), selectedLayerId });
    useLayerStore.getState().removeLayer(id);

    handleKeyDown(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(useLayerStore.getState().layers).toHaveLength(1);

    handleKeyDown(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it('Delete saves state for undo', () => {
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Test', fabricObject: null });
    useLayerStore.getState().selectLayer(id);

    handleKeyDown(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(useHistoryStore.getState().past).toHaveLength(1);
  });
});
