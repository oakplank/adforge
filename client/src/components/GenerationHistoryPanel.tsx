import type { GenerationHistoryItem } from '../hooks/useGenerationHistory';

interface GenerationHistoryPanelProps {
  generations: GenerationHistoryItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoad: (item: GenerationHistoryItem) => void;
  onClose: () => void;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function GenerationHistoryPanel({
  generations,
  isLoading,
  error,
  onRefresh,
  onLoad,
  onClose,
}: GenerationHistoryPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[94vw] max-w-6xl max-h-[84vh] bg-[#111118] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Generations</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {generations.length} run{generations.length !== 1 ? 's' : ''} in your history
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="toolbar-button text-xs">
              Refresh
            </button>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg transition-colors">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-sm text-zinc-500">Loading generation history...</div>
          ) : generations.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-500">No generation history yet.</p>
              <p className="text-xs text-zinc-600 mt-1">Generate an ad and it will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {generations.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
                >
                  <div className="h-56 bg-black/40 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                      <span>{formatTimestamp(item.createdAt)}</span>
                      <span className="uppercase tracking-wide">{item.format}</span>
                    </div>

                    <p className="text-sm text-zinc-100 line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-zinc-400 line-clamp-2">{item.imagePrompt}</p>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-zinc-500 truncate pr-2">
                        {item.model || 'model unknown'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(item.prompt);
                            } catch {
                              // Ignore clipboard failures.
                            }
                          }}
                          className="toolbar-button text-xs"
                        >
                          Copy Prompt
                        </button>
                        <button
                          onClick={() => onLoad(item)}
                          className="primary-button text-xs"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
