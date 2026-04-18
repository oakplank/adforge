import type { SavedAd } from '../hooks/useSavedAds';

interface SavedAdsPanelProps {
  ads: SavedAd[];
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function SavedAdsPanel({ ads, onDelete, onClose }: SavedAdsPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[90vw] max-w-3xl max-h-[80vh] bg-[#111118] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Saved Ads</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{ads.length} ad{ads.length !== 1 ? 's' : ''} saved locally</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {ads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3 opacity-30">📁</div>
              <p className="text-sm text-zinc-500">No saved ads yet</p>
              <p className="text-xs text-zinc-600 mt-1">Generate an ad and click Save to keep it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {ads.map(ad => (
                <div key={ad.id} className="group relative rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-all">
                  <div className="aspect-square bg-zinc-900 overflow-hidden">
                    <img src={ad.thumbnail} alt={ad.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-zinc-300 truncate">{ad.name}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{ad.format} · {ad.width}×{ad.height}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={ad.thumbnail}
                      download={`${ad.name || 'ad'}.png`}
                      className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                      ↓ Download
                    </a>
                    <button
                      onClick={() => onDelete(ad.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
