import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasEditor } from './CanvasEditor';
import { FormatProvider } from '../context/FormatContext';

const mockAdd = vi.fn();
const mockRemove = vi.fn();
const mockGetObjects = vi.fn().mockReturnValue([]);
const mockRenderAll = vi.fn();

vi.mock('fabric', () => {
  const MockCanvas = vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    add: mockAdd,
    remove: mockRemove,
    getObjects: mockGetObjects,
    setActiveObject: vi.fn(),
    renderAll: mockRenderAll,
    width: 1080,
    height: 1080,
  }));
  const MockIText = vi.fn().mockImplementation((text, opts) => ({
    type: 'i-text',
    text,
    ...opts,
  }));
  const MockLine = vi.fn().mockImplementation((_coords: number[], opts: any) => ({
    type: 'line',
    ...opts,
    set: vi.fn(),
  }));
  const MockRect = vi.fn().mockImplementation((opts) => ({
    type: 'rect',
    ...opts,
    set: vi.fn(),
  }));
  return { Canvas: MockCanvas, IText: MockIText, Line: MockLine, Rect: MockRect };
});

function renderWithProviders() {
  return render(
    <FormatProvider>
      <CanvasEditor />
    </FormatProvider>
  );
}

describe('Grid and Safe Zone toggles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetObjects.mockReturnValue([]);
  });

  it('renders grid toggle button', () => {
    renderWithProviders();
    expect(screen.getByTestId('toggle-grid-button')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-grid-button')).toHaveTextContent('Grid');
  });

  it('renders safe zones toggle button', () => {
    renderWithProviders();
    expect(screen.getByTestId('toggle-safe-zones-button')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-safe-zones-button')).toHaveTextContent('Safe Zones');
  });

  it('clicking grid button toggles grid overlay', () => {
    renderWithProviders();
    const btn = screen.getByTestId('toggle-grid-button');
    fireEvent.click(btn);
    // After toggling on, should add grid lines (4 lines for rule of thirds)
    expect(mockAdd).toHaveBeenCalled();
  });

  it('clicking safe zones button toggles safe zone overlay', () => {
    renderWithProviders();
    const btn = screen.getByTestId('toggle-safe-zones-button');
    fireEvent.click(btn);
    // After toggling on, should add safe zone rects (2 rects)
    expect(mockAdd).toHaveBeenCalled();
  });

  it('grid button changes style when active', () => {
    renderWithProviders();
    const btn = screen.getByTestId('toggle-grid-button');
    expect(btn.className).toContain('editor-toolbar-button');
    fireEvent.click(btn);
    expect(btn.className).toContain('editor-toggle-active');
  });

  it('safe zones button changes style when active', () => {
    renderWithProviders();
    const btn = screen.getByTestId('toggle-safe-zones-button');
    expect(btn.className).toContain('editor-toolbar-button');
    fireEvent.click(btn);
    expect(btn.className).toContain('editor-toggle-active');
  });
});
