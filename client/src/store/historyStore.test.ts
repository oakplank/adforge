import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from './historyStore';
import type { HistoryEntry } from './historyStore';

function makeEntry(id: string): HistoryEntry {
  return {
    layers: [{ id, type: 'text', name: id, zIndex: 0, visible: true, locked: false, opacity: 1, fabricObject: null }],
    selectedLayerId: id,
  };
}

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({ past: [], future: [] });
  });

  it('pushState adds to past and clears future', () => {
    const store = useHistoryStore.getState();
    store.pushState(makeEntry('a'));
    store.pushState(makeEntry('b'));
    expect(useHistoryStore.getState().past).toHaveLength(2);

    // Undo to create future
    const current = makeEntry('c');
    store.undo(current);
    expect(useHistoryStore.getState().future).toHaveLength(1);

    // Push clears future
    store.pushState(makeEntry('d'));
    expect(useHistoryStore.getState().future).toHaveLength(0);
  });

  it('undo returns previous state and pushes current to future', () => {
    const store = useHistoryStore.getState();
    const a = makeEntry('a');
    const b = makeEntry('b');
    store.pushState(a);
    store.pushState(b);

    const current = makeEntry('current');
    const result = store.undo(current);
    expect(result).toEqual(b);
    expect(useHistoryStore.getState().past).toHaveLength(1);
    expect(useHistoryStore.getState().future[0]).toEqual(current);
  });

  it('undo returns null when nothing to undo', () => {
    const result = useHistoryStore.getState().undo(makeEntry('x'));
    expect(result).toBeNull();
  });

  it('redo returns next state and pushes current to past', () => {
    const store = useHistoryStore.getState();
    store.pushState(makeEntry('a'));
    const current = makeEntry('current');
    store.undo(current); // now future has 'current'

    const afterUndo = makeEntry('after-undo');
    const result = store.redo(afterUndo);
    expect(result).toEqual(current);
    expect(useHistoryStore.getState().past).toHaveLength(1);
  });

  it('redo returns null when nothing to redo', () => {
    const result = useHistoryStore.getState().redo(makeEntry('x'));
    expect(result).toBeNull();
  });

  it('canUndo and canRedo reflect state', () => {
    const store = useHistoryStore.getState();
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);

    store.pushState(makeEntry('a'));
    expect(useHistoryStore.getState().canUndo()).toBe(true);

    useHistoryStore.getState().undo(makeEntry('c'));
    expect(useHistoryStore.getState().canRedo()).toBe(true);
  });

  it('respects maxHistory limit', () => {
    useHistoryStore.setState({ maxHistory: 3 });
    const store = useHistoryStore.getState();
    for (let i = 0; i < 5; i++) {
      store.pushState(makeEntry(`e${i}`));
    }
    expect(useHistoryStore.getState().past).toHaveLength(3);
  });
});
