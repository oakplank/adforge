import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from './ExportDialog';

// Mock the export utils
vi.mock('../utils/exportCanvas', async () => {
  const actual = await vi.importActual('../utils/exportCanvas') as any;
  return {
    ...actual,
    exportCanvasToDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    triggerDownload: vi.fn(),
  };
});

import { exportCanvasToDataURL, triggerDownload } from '../utils/exportCanvas';

const mockCanvas = {
  getObjects: vi.fn(() => []),
  renderAll: vi.fn(),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
} as any;

describe('ExportDialog', () => {
  it('renders export dialog with format options', () => {
    render(<ExportDialog canvas={mockCanvas} onClose={vi.fn()} />);
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('format-png')).toBeInTheDocument();
    expect(screen.getByTestId('format-jpg')).toBeInTheDocument();
  });

  it('shows quality slider only for JPG format', () => {
    render(<ExportDialog canvas={mockCanvas} onClose={vi.fn()} />);
    // PNG is default, no quality control
    expect(screen.queryByTestId('quality-control')).not.toBeInTheDocument();

    // Switch to JPG
    fireEvent.click(screen.getByTestId('format-jpg'));
    expect(screen.getByTestId('quality-control')).toBeInTheDocument();
  });

  it('has scale options 1x and 2x', () => {
    render(<ExportDialog canvas={mockCanvas} onClose={vi.fn()} />);
    expect(screen.getByTestId('scale-1x')).toBeInTheDocument();
    expect(screen.getByTestId('scale-2x')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<ExportDialog canvas={mockCanvas} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('export-cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('exports and closes on confirm', () => {
    const onClose = vi.fn();
    render(<ExportDialog canvas={mockCanvas} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('export-confirm'));
    expect(exportCanvasToDataURL).toHaveBeenCalled();
    expect(triggerDownload).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('exports as JPG with quality when JPG selected', () => {
    render(<ExportDialog canvas={mockCanvas} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('format-jpg'));
    fireEvent.click(screen.getByTestId('export-confirm'));
    expect(exportCanvasToDataURL).toHaveBeenCalledWith(
      mockCanvas,
      expect.objectContaining({ format: 'jpg' }),
    );
  });
});
