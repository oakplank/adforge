import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';
import { FormatProvider } from '../context/FormatContext';

vi.mock('./CanvasEditor', () => ({
  CanvasEditor: ({ width, height }: { width: number; height: number }) => (
    <div data-testid="canvas-editor">Canvas Mock {width}x{height}</div>
  ),
}));

function renderWithProvider() {
  return render(
    <FormatProvider>
      <AppShell />
    </FormatProvider>
  );
}

describe('AppShell', () => {
  it('renders the app shell container', () => {
    renderWithProvider();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('renders top bar with logo, format selector, and export button', () => {
    renderWithProvider();
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    expect(screen.getByText('AdForge Studio')).toBeInTheDocument();
    expect(screen.getByTestId('format-selector')).toBeInTheDocument();
    expect(screen.getByTestId('export-button')).toBeInTheDocument();
  });

  it('renders layers panel (left sidebar)', () => {
    renderWithProvider();
    expect(screen.getByTestId('layers-panel')).toBeInTheDocument();
    expect(screen.getByText('Layers')).toBeInTheDocument();
  });

  it('renders canvas area (center)', () => {
    renderWithProvider();
    expect(screen.getByTestId('canvas-area')).toBeInTheDocument();
  });

  it('renders properties panel (right sidebar)', () => {
    renderWithProvider();
    expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('renders prompt bar (bottom)', () => {
    renderWithProvider();
    expect(screen.getByTestId('prompt-bar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe product, offer, audience, and vibe/i)).toBeInTheDocument();
  });

  it('uses new studio theme class names', () => {
    renderWithProvider();
    const shell = screen.getByTestId('app-shell');
    expect(shell.className).toContain('app-shell');

    const topBar = screen.getByTestId('top-bar');
    expect(topBar.className).toContain('app-topbar');
  });
});
