import { create } from 'zustand';
import type { Layer } from '../types/layers';

export interface HistoryEntry {
  layers: Layer[];
  selectedLayerId: string | null;
}

export interface HistoryStore {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistory: number;

  pushState: (entry: HistoryEntry) => void;
  undo: (currentState: HistoryEntry) => HistoryEntry | null;
  redo: (currentState: HistoryEntry) => HistoryEntry | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  maxHistory: 50,

  pushState: (entry) => {
    set((s) => ({
      past: [...s.past, entry].slice(-s.maxHistory),
      future: [],
    }));
  },

  undo: (currentState) => {
    const { past } = get();
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [currentState, ...s.future],
    }));
    return previous;
  },

  redo: (currentState) => {
    const { future } = get();
    if (future.length === 0) return null;
    const next = future[0];
    set((s) => ({
      past: [...s.past, currentState],
      future: s.future.slice(1),
    }));
    return next;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),
}));
