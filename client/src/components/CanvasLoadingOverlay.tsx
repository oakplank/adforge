export function CanvasLoadingOverlay() {
  return (
    <div
      data-testid="canvas-loading-overlay"
      className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-black/45 backdrop-blur-[1px]"
    >
      <div className="flex flex-col items-center gap-3">
        <svg className="h-10 w-10 animate-spin text-orange-300" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-zinc-200 text-sm">Rendering Instagram-ready base image...</span>
      </div>
    </div>
  );
}
