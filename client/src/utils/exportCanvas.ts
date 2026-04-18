import type { Canvas, FabricObject } from 'fabric';

export type ExportFormat = 'png' | 'jpg';
export type ExportScale = 1 | 2;

export interface ExportOptions {
  format: ExportFormat;
  quality: number; // 0.0 - 1.0, only used for jpg
  scale: ExportScale;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'png',
  quality: 0.92,
  scale: 1,
};

type OverlayTaggedObject = FabricObject & {
  data?: { isOverlay?: boolean; isSafeZone?: boolean; isGrid?: boolean };
};

function isOverlay(obj: FabricObject): obj is OverlayTaggedObject {
  const data = (obj as OverlayTaggedObject).data;
  return Boolean(data?.isOverlay || data?.isSafeZone || data?.isGrid);
}

export function generateExportFilename(format: ExportFormat, timestamp?: number): string {
  const ts = timestamp ?? Date.now();
  const ext = format === 'jpg' ? 'jpg' : 'png';
  return `adforge-${format}-${ts}.${ext}`;
}

export function exportCanvasToDataURL(
  canvas: Canvas,
  options: ExportOptions,
): string {
  // Hide overlay objects (grid, safe zones) before export
  const overlayObjects = canvas.getObjects().filter(isOverlay);
  overlayObjects.forEach((obj) => {
    obj.visible = false;
  });

  canvas.renderAll();

  const multiplier = options.scale;
  const quality = options.format === 'jpg' ? options.quality : undefined;

  const dataURL = canvas.toDataURL({
    format: options.format === 'jpg' ? 'jpeg' : 'png',
    quality,
    multiplier,
  });

  // Restore overlay objects
  overlayObjects.forEach((obj) => {
    obj.visible = true;
  });
  canvas.renderAll();

  return dataURL;
}

export function triggerDownload(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
