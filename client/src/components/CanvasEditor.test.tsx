import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CanvasEditor } from './CanvasEditor';
import { FormatProvider } from '../context/FormatContext';

// Mock fabric.js since jsdom doesn't have real canvas
vi.mock('fabric', () => {
  const mockDispose = vi.fn();
  const MockCanvas = vi.fn().mockImplementation(() => ({
    dispose: mockDispose,
    on: vi.fn(),
    off: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    getObjects: vi.fn().mockReturnValue([]),
    setActiveObject: vi.fn(),
    renderAll: vi.fn(),
    width: 1080,
    height: 1080,
  }));
  const MockIText = vi.fn().mockImplementation((text, opts) => ({
    type: 'i-text',
    text,
    ...opts,
  }));
  const MockLine = vi.fn().mockImplementation(() => ({ set: vi.fn() }));
  const MockRect = vi.fn().mockImplementation(() => ({ set: vi.fn() }));
  return { Canvas: MockCanvas, IText: MockIText, Line: MockLine, Rect: MockRect };
});

const W = (ui: React.ReactElement) => <FormatProvider>{ui}</FormatProvider>;

describe('CanvasEditor', () => {
  it('renders a canvas element', () => {
    render(W(<CanvasEditor />));
    const canvas = screen.getByTestId('fabric-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('accepts custom width and height props', () => {
    render(W(<CanvasEditor width={1080} height={1350} />));
    expect(screen.getByTestId('fabric-canvas')).toBeInTheDocument();
  });

  it('renders Add Text button', () => {
    render(W(<CanvasEditor />));
    expect(screen.getByTestId('add-text-button')).toBeInTheDocument();
    expect(screen.getByTestId('add-text-button')).toHaveTextContent('Text');
  });
});
