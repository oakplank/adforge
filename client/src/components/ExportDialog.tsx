import { useState } from 'react';
import type { Canvas } from 'fabric';
import {
  type ExportFormat,
  type ExportScale,
  type ExportOptions,
  DEFAULT_EXPORT_OPTIONS,
  exportCanvasToDataURL,
  generateExportFilename,
  triggerDownload,
} from '../utils/exportCanvas';

interface ExportDialogProps {
  canvas: Canvas | null;
  onClose: () => void;
}

export function ExportDialog({ canvas, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(DEFAULT_EXPORT_OPTIONS.format);
  const [quality, setQuality] = useState(DEFAULT_EXPORT_OPTIONS.quality);
  const [scale, setScale] = useState<ExportScale>(DEFAULT_EXPORT_OPTIONS.scale);

  const handleExport = () => {
    if (!canvas) return;

    const options: ExportOptions = { format, quality, scale };
    const dataURL = exportCanvasToDataURL(canvas, options);
    const filename = generateExportFilename(format);
    triggerDownload(dataURL, filename);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="export-dialog">
      <div className="w-80 rounded-lg border border-white/10 bg-zinc-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Export Ad</h2>

        {/* Format */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-1">Format</label>
          <div className="flex gap-2">
            <button
              data-testid="format-png"
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${format === 'png' ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
              onClick={() => setFormat('png')}
            >
              PNG
            </button>
            <button
              data-testid="format-jpg"
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${format === 'jpg' ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
              onClick={() => setFormat('jpg')}
            >
              JPG
            </button>
          </div>
        </div>

        {/* Quality (JPG only) */}
        {format === 'jpg' && (
          <div className="mb-4" data-testid="quality-control">
            <label className="block text-sm text-zinc-400 mb-1">
              Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
              data-testid="quality-slider"
            />
          </div>
        )}

        {/* Scale */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-1">Scale</label>
          <div className="flex gap-2">
            <button
              data-testid="scale-1x"
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${scale === 1 ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
              onClick={() => setScale(1)}
            >
              1x
            </button>
            <button
              data-testid="scale-2x"
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${scale === 2 ? 'bg-orange-500 text-zinc-950' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
              onClick={() => setScale(2)}
            >
              2x
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded text-sm bg-zinc-700 hover:bg-zinc-600 transition-colors"
            data-testid="export-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 py-2 rounded text-sm font-medium bg-orange-500 text-zinc-950 hover:bg-orange-400 transition-colors"
            data-testid="export-confirm"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
