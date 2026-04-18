import { describe, it, expect, vi } from 'vitest';
import {
  generateExportFilename,
  DEFAULT_EXPORT_OPTIONS,
  exportCanvasToDataURL,
  triggerDownload,
  type ExportOptions,
} from './exportCanvas';

describe('generateExportFilename', () => {
  it('generates PNG filename with timestamp', () => {
    const result = generateExportFilename('png', 1700000000000);
    expect(result).toBe('adforge-png-1700000000000.png');
  });

  it('generates JPG filename with timestamp', () => {
    const result = generateExportFilename('jpg', 1700000000000);
    expect(result).toBe('adforge-jpg-1700000000000.jpg');
  });

  it('uses current timestamp when none provided', () => {
    const before = Date.now();
    const result = generateExportFilename('png');
    const after = Date.now();
    const match = result.match(/adforge-png-(\d+)\.png/);
    expect(match).toBeTruthy();
    const ts = Number(match![1]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('matches pattern adforge-{format}-{timestamp}.{ext}', () => {
    expect(generateExportFilename('png', 123)).toMatch(/^adforge-png-\d+\.png$/);
    expect(generateExportFilename('jpg', 123)).toMatch(/^adforge-jpg-\d+\.jpg$/);
  });
});

describe('DEFAULT_EXPORT_OPTIONS', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_EXPORT_OPTIONS.format).toBe('png');
    expect(DEFAULT_EXPORT_OPTIONS.quality).toBe(0.92);
    expect(DEFAULT_EXPORT_OPTIONS.scale).toBe(1);
  });
});

describe('exportCanvasToDataURL', () => {
  it('hides overlay objects during export and restores them', () => {
    const overlayObj = { data: { isOverlay: true }, visible: true };
    const safeZoneObj = { data: { isSafeZone: true }, visible: true };
    const gridObj = { data: { isGrid: true }, visible: true };
    const normalObj = { data: {}, visible: true };

    const mockCanvas = {
      getObjects: vi.fn(() => [overlayObj, safeZoneObj, gridObj, normalObj]),
      renderAll: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/png;base64,abc'),
    };

    const options: ExportOptions = { format: 'png', quality: 0.92, scale: 1 };
    const result = exportCanvasToDataURL(mockCanvas as any, options);

    expect(result).toBe('data:image/png;base64,abc');
    // Overlays should be restored
    expect(overlayObj.visible).toBe(true);
    expect(safeZoneObj.visible).toBe(true);
    expect(gridObj.visible).toBe(true);
    expect(normalObj.visible).toBe(true);
    expect(mockCanvas.renderAll).toHaveBeenCalledTimes(2);
  });

  it('passes jpeg format and quality for jpg export', () => {
    const mockCanvas = {
      getObjects: vi.fn(() => []),
      renderAll: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,abc'),
    };

    const options: ExportOptions = { format: 'jpg', quality: 0.8, scale: 2 };
    exportCanvasToDataURL(mockCanvas as any, options);

    expect(mockCanvas.toDataURL).toHaveBeenCalledWith({
      format: 'jpeg',
      quality: 0.8,
      multiplier: 2,
    });
  });

  it('passes png format without quality', () => {
    const mockCanvas = {
      getObjects: vi.fn(() => []),
      renderAll: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/png;base64,abc'),
    };

    const options: ExportOptions = { format: 'png', quality: 0.92, scale: 1 };
    exportCanvasToDataURL(mockCanvas as any, options);

    expect(mockCanvas.toDataURL).toHaveBeenCalledWith({
      format: 'png',
      quality: undefined,
      multiplier: 1,
    });
  });
});

describe('triggerDownload', () => {
  it('creates a link element and triggers click', () => {
    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
      return node;
    });
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node: any) => {
      return node;
    });

    const createSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any);

    triggerDownload('data:image/png;base64,abc', 'test.png');

    expect(clickSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    createSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
