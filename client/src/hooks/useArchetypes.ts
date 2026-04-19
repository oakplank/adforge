import { useEffect, useState } from 'react';

// Shape mirrors server adArchetypes.listArchetypes() payload. Kept
// un-exported — consumers access it via useArchetypes()'s return type
// so we don't advertise a second import path for the same shape.
interface ArchetypeOption {
  id: string;
  label: string;
  description: string;
}

interface State {
  archetypes: ArchetypeOption[];
  isLoading: boolean;
  error: string | null;
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
    (async () => {
      try {
        const res = await fetch('/api/archetypes');
        if (!res.ok) throw new Error('Failed to load archetypes');
        const data = await res.json();
        if (cancelled) return;
        const archetypes: ArchetypeOption[] = Array.isArray(data?.archetypes)
          ? data.archetypes
          : [];
        setState({ archetypes, isLoading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState({ archetypes: [], isLoading: false, error: message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
