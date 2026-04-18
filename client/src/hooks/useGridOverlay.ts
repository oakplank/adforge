import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { getSafeZonePixels } from '../types/safeZones';

type OverlayData = { isOverlay: true; kind: 'grid' | 'safeZone' };
type OverlayTaggedObject = fabric.FabricObject & { data?: OverlayData };

function tagOverlay(obj: fabric.FabricObject, kind: OverlayData['kind']) {
  (obj as OverlayTaggedObject).data = { isOverlay: true, kind };
  obj.set({
    selectable: false,
    evented: false,
    excludeFromExport: true,
  });
}

function isOverlayObject(obj: fabric.FabricObject): boolean {
  return Boolean((obj as OverlayTaggedObject).data?.isOverlay);
}

function removeOverlays(canvas: fabric.Canvas) {
  const toRemove = canvas.getObjects().filter(isOverlayObject);
  toRemove.forEach((o) => canvas.remove(o));
}

function createGridLines(width: number, height: number): fabric.FabricObject[] {
  const lines: fabric.FabricObject[] = [];
  const strokeOpts = { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1, strokeDashArray: [5, 5] };

  for (const frac of [1 / 3, 2 / 3]) {
    const line = new fabric.Line([width * frac, 0, width * frac, height], strokeOpts);
    tagOverlay(line, 'grid');
    lines.push(line);
  }
  for (const frac of [1 / 3, 2 / 3]) {
    const line = new fabric.Line([0, height * frac, width, height * frac], strokeOpts);
    tagOverlay(line, 'grid');
    lines.push(line);
  }
  return lines;
}

function createSafeZoneRects(formatId: string, width: number, height: number): fabric.FabricObject[] {
  const zones = getSafeZonePixels(formatId, width, height);
  const rects: fabric.FabricObject[] = [];

  const ts = zones.titleSafe;
  const titleRect = new fabric.Rect({
    left: ts.left,
    top: ts.top,
    width: width - ts.left - ts.right,
    height: height - ts.top - ts.bottom,
    fill: 'transparent',
    stroke: 'rgba(255,100,100,0.5)',
    strokeWidth: 1,
    strokeDashArray: [8, 4],
  });
  tagOverlay(titleRect, 'safeZone');
  rects.push(titleRect);

  const as_ = zones.actionSafe;
  const actionRect = new fabric.Rect({
    left: as_.left,
    top: as_.top,
    width: width - as_.left - as_.right,
    height: height - as_.top - as_.bottom,
    fill: 'transparent',
    stroke: 'rgba(100,200,255,0.5)',
    strokeWidth: 1,
    strokeDashArray: [4, 4],
  });
  tagOverlay(actionRect, 'safeZone');
  rects.push(actionRect);

  return rects;
}

export function useGridOverlay(
  canvas: fabric.Canvas | null,
  showGrid: boolean,
  showSafeZones: boolean,
  formatId: string,
  width: number,
  height: number
) {
  const prevRef = useRef({ showGrid: false, showSafeZones: false, formatId: '', width: 0, height: 0 });

  useEffect(() => {
    if (!canvas) return;

    removeOverlays(canvas);

    if (showGrid) {
      createGridLines(width, height).forEach((obj) => canvas.add(obj));
    }

    if (showSafeZones) {
      createSafeZoneRects(formatId, width, height).forEach((obj) => canvas.add(obj));
    }

    canvas.renderAll();

    prevRef.current = { showGrid, showSafeZones, formatId, width, height };
  }, [canvas, showGrid, showSafeZones, formatId, width, height]);
}
