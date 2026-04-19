import { useEffect, useState } from 'react';

// Shape mirrors server adArchetypes.listArchetypes() payload. Kept
// un-exported — consumers access it via useArchetypes()'s return type
// so we don't advertise a second import path for the same shape.
interface ArchetypeOption {
  id: string;
  label: string;
  description: string;
  examplePrompts: string[];
}

interface State {
  archetypes: ArchetypeOption[];
  isLoading: boolean;
  error: string | null;
}

// Module-level promise cache so multiple components calling
// useArchetypes() share a single network request. Without this the
// catalog would be fetched once per consumer (selector, prompt chips,
// etc.) — functionally harmless but wasteful, and it also breaks any
// test that counts fetch calls with precision.
//
// Exposed only as a reset helper for tests. Production code never
// clears the cache; the catalog is effectively read-only for a session.
let cachedFetch: Promise<ArchetypeOption[]> | null = null;

export function __resetArchetypesCacheForTests(): void {
  cachedFetch = null;
}

function normalize(data: unknown): ArchetypeOption[] {
  const payload = data as { archetypes?: unknown };
  if (!Array.isArray(payload?.archetypes)) return [];
  return (payload.archetypes as Array<Partial<ArchetypeOption>>).map((a) => ({
    id: String(a.id ?? ''),
    label: String(a.label ?? ''),
    description: String(a.description ?? ''),
    examplePrompts: Array.isArray(a.examplePrompts)
      ? a.examplePrompts.filter((s): s is string => typeof s === 'string')
      : [],
  }));
}

function loadArchetypes(): Promise<ArchetypeOption[]> {
  if (cachedFetch) return cachedFetch;
  cachedFetch = (async () => {
    const res = await fetch('/api/archetypes');
    if (!res.ok) {
      // Don't cache failures — next consumer should retry.
      cachedFetch = null;
      throw new Error('Failed to load archetypes');
    }
    return normalize(await res.json());
  })().catch((err) => {
    cachedFetch = null;
    throw err;
  });
  return cachedFetch;
}

// Fetch the archetype catalog from the server. The server is the source
// of truth — we could hardcode them client-side, but doing so means every
// archetype edit needs two files to move together. One source, one fetch.
export function useArchetypes(): State {
  const [state, setState] = useState<State>({
    archetypes: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    loadArchetypes()
      .then((archetypes) => {
        if (cancelled) return;
        setState({ archetypes, isLoading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState({ archetypes: [], isLoading: false, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
