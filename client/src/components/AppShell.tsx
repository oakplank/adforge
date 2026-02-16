import { useState, useCallback } from 'react';
import type { Canvas } from 'fabric';
import { CanvasEditor } from './CanvasEditor';
import { CanvasLoadingOverlay } from './CanvasLoadingOverlay';
import { ExportDialog } from './ExportDialog';
import { FormatSelector } from './FormatSelector';
import { GenerationHistoryPanel } from './GenerationHistoryPanel';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { PromptBar } from './PromptBar';
import { SavedAdsPanel } from './SavedAdsPanel';
import { useFormat } from '../context/FormatContext';
import { useGenerationState } from '../context/GenerationContext';
import { useAdComposition } from '../hooks/useAdComposition';
import type { GenerationResult } from '../hooks/useGeneration';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useGenerationHistory, type GenerationHistoryItem } from '../hooks/useGenerationHistory';
import { useSavedAds } from '../hooks/useSavedAds';

export function AppShell() {
  const { format } = useFormat();
  const { isGenerating } = useGenerationState();
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showGenerations, setShowGenerations] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const { savedAds, saveAd, deleteAd } = useSavedAds();
  const {
    generations,
    isLoading: isHistoryLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useGenerationHistory();

  useKeyboardShortcuts();

  const { compose } = useAdComposition({
    canvas,
    formatId: format.id,
    canvasWidth: format.width,
    canvasHeight: format.height,
  });

  const handleCanvasReady = useCallback((nextCanvas: Canvas) => {
    setCanvas(nextCanvas);
  }, []);

  const handleSave = useCallback(() => {
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
    saveAd({
      thumbnail: dataUrl,
      format: format.id,
      width: format.width,
      height: format.height,
      createdAt: new Date().toISOString(),
    });
  }, [canvas, format, saveAd]);

  const handleGenerated = useCallback(async (result: GenerationResult) => {
    await compose(result);
    void refreshHistory();
  }, [compose, refreshHistory]);

  const handleLoadGeneration = useCallback(async (item: GenerationHistoryItem) => {
    await compose({
      adSpec: item.adSpec,
      imageUrl: item.imageUrl,
    });
    setShowGenerations(false);
  }, [compose]);

  return (
    <div className="app-shell h-screen w-screen flex flex-col overflow-hidden" data-testid="app-shell">
      <header className="app-topbar h-12 min-h-[48px] px-4" data-testid="top-bar">
        <div className="flex items-center gap-3 min-w-0">
          <div className="brand-chip">
            <span className="brand-dot" />
            <span className="brand-title">AdForge Studio</span>
          </div>
          <div className="pipeline-tag hidden md:flex">One Prompt -&gt; Styled Render -&gt; Editable Canvas</div>
          <FormatSelector />
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="status-chip">Auto Layout</span>
            <span className="status-chip">AI Guided</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowGenerations(true);
              void refreshHistory();
            }}
            className="toolbar-button"
            title="Generation History"
          >
            Generations
            {generations.length > 0 && <span className="badge">{generations.length}</span>}
          </button>

          <button onClick={() => setShowSaved(true)} className="toolbar-button" title="Saved Ads">
            Saved
            {savedAds.length > 0 && <span className="badge">{savedAds.length}</span>}
          </button>

          <button onClick={handleSave} className="toolbar-button" title="Save Ad">
            Snapshot
          </button>

          <button
            data-testid="export-button"
            className="primary-button"
            onClick={() => setShowExport(true)}
          >
            Export PNG
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside
          className={`app-panel border-r shrink-0 flex flex-col transition-all duration-300 ${
            leftCollapsed ? 'w-11' : 'w-52 lg:w-56'
          }`}
          data-testid="layers-panel"
        >
          <div className="panel-header">
            {!leftCollapsed && <span className="panel-label mb-0">Layers</span>}
            <button
              onClick={() => setLeftCollapsed((prev) => !prev)}
              className="panel-toggle"
              data-testid="toggle-left-panel"
            >
              {leftCollapsed ? '>' : '<'}
            </button>
          </div>
          {!leftCollapsed && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <LayersPanel />
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 relative overflow-hidden app-canvas-stage" data-testid="canvas-area">
          <CanvasEditor width={format.width} height={format.height} onCanvasReady={handleCanvasReady} />
          {isGenerating && <CanvasLoadingOverlay />}
        </main>

        <aside
          className={`app-panel border-l shrink-0 flex flex-col transition-all duration-300 ${
            rightCollapsed ? 'w-11' : 'w-56 lg:w-60'
          }`}
          data-testid="properties-panel"
        >
          <div className="panel-header">
            <button
              onClick={() => setRightCollapsed((prev) => !prev)}
              className="panel-toggle"
              data-testid="toggle-right-panel"
            >
              {rightCollapsed ? '<' : '>'}
            </button>
            {!rightCollapsed && <span className="panel-label mb-0">Properties</span>}
          </div>
          {!rightCollapsed && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <PropertiesPanel />
            </div>
          )}
        </aside>
      </div>

      <PromptBar onGenerated={handleGenerated} />

      {showExport && <ExportDialog canvas={canvas} onClose={() => setShowExport(false)} />}
      {showSaved && <SavedAdsPanel ads={savedAds} onDelete={deleteAd} onClose={() => setShowSaved(false)} />}
      {showGenerations && (
        <GenerationHistoryPanel
          generations={generations}
          isLoading={isHistoryLoading}
          error={historyError}
          onRefresh={() => void refreshHistory()}
          onLoad={handleLoadGeneration}
          onClose={() => setShowGenerations(false)}
        />
      )}
    </div>
  );
}
