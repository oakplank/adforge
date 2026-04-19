import { useGenerationState } from '../context/GenerationContext';
import { useArchetypes } from '../hooks/useArchetypes';

// Horizontal row of category chips above the prompt textarea. The user
// picks one ("Sale / Offer", "Luxury", "Food & Beverage"…) and every
// downstream stage — render prompt, system prompt, copy voice, char
// limits — pulls from that archetype's brief. The "Auto" chip clears
// the selection and falls back to the server's general archetype.
//
// We deliberately render all archetypes inline (scrollable) instead of a
// dropdown: the whole point of this selector is to *advertise* the
// opinionated categories so users stop reaching for the same generic
// prompt. A hidden dropdown buries that affordance.
export function ArchetypeSelector() {
  const { archetypes, isLoading, error } = useArchetypes();
  const { selectedArchetypeId, setSelectedArchetypeId, isGenerating } =
    useGenerationState();

  if (error) {
    return (
      <div
        data-testid="archetype-selector-error"
        className="text-rose-300 text-xs"
      >
        Couldn&rsquo;t load categories — using general brief. ({error})
      </div>
    );
  }

  return (
    <div
      data-testid="archetype-selector"
      className="archetype-selector flex items-center gap-2 overflow-x-auto pb-1"
    >
      <span className="archetype-selector-label text-xs text-zinc-400 whitespace-nowrap pr-1">
        Category
      </span>

      <ArchetypeChip
        key="auto"
        id={null}
        label="Auto"
        description="No category — use the general brief."
        selected={selectedArchetypeId === null}
        disabled={isGenerating}
        onSelect={() => setSelectedArchetypeId(null)}
      />

      {isLoading && (
        <span
          data-testid="archetype-selector-loading"
          className="text-xs text-zinc-500"
        >
          Loading…
        </span>
      )}

      {archetypes.map((a) => (
        <ArchetypeChip
          key={a.id}
          id={a.id}
          label={a.label}
          description={a.description}
          selected={selectedArchetypeId === a.id}
          disabled={isGenerating}
          onSelect={() => setSelectedArchetypeId(a.id)}
        />
      ))}
    </div>
  );
}

interface ArchetypeChipProps {
  id: string | null;
  label: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function ArchetypeChip({
  id,
  label,
  description,
  selected,
  disabled,
  onSelect,
}: ArchetypeChipProps) {
  const base =
    'whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors';
  const tone = selected
    ? 'border-orange-400/70 bg-orange-400/15 text-orange-100'
    : 'border-zinc-700/70 bg-zinc-900/40 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100';
  const dim = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type="button"
      data-testid={`archetype-chip-${id ?? 'auto'}`}
      data-selected={selected ? 'true' : 'false'}
      aria-pressed={selected}
      title={description}
      disabled={disabled}
      onClick={onSelect}
      className={`${base} ${tone} ${dim}`.trim()}
    >
      {label}
    </button>
  );
}
