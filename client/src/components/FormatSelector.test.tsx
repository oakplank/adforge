import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormatSelector } from './FormatSelector';
import { FormatProvider } from '../context/FormatContext';

// Also test with AppShell to verify canvas resize
vi.mock('./CanvasEditor', () => ({
  CanvasEditor: ({ width, height }: { width: number; height: number }) => (
    <div data-testid="canvas-editor">{width}×{height}</div>
  ),
}));

function renderSelector() {
  return render(
    <FormatProvider>
      <FormatSelector />
    </FormatProvider>
  );
}

describe('FormatSelector', () => {
  it('renders a select with three format options', () => {
    renderSelector();
    const select = screen.getByTestId('format-selector') as HTMLSelectElement;
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toContain('Square');
    expect(options[1].textContent).toContain('Portrait');
    expect(options[2].textContent).toContain('Story');
  });

  it('defaults to Square (1080x1080)', () => {
    renderSelector();
    const select = screen.getByTestId('format-selector') as HTMLSelectElement;
    expect(select.value).toBe('square');
  });

  it('can select Portrait format', () => {
    renderSelector();
    const select = screen.getByTestId('format-selector') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'portrait' } });
    expect(select.value).toBe('portrait');
  });

  it('can select Story format', () => {
    renderSelector();
    const select = screen.getByTestId('format-selector') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'story' } });
    expect(select.value).toBe('story');
  });
});

describe('FormatSelector + Canvas integration', () => {
  it('selecting Portrait resizes canvas to 1080x1350', async () => {
    const { AppShell } = await import('./AppShell');
    render(
      <FormatProvider>
        <AppShell />
      </FormatProvider>
    );
    const select = screen.getByTestId('format-selector') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'portrait' } });
    expect(screen.getByTestId('canvas-editor').textContent).toBe('1080×1350');
  });

  it('selecting Story resizes canvas to 1080x1920', async () => {
    const { AppShell } = await import('./AppShell');
    render(
      <FormatProvider>
        <AppShell />
      </FormatProvider>
    );
    const select = screen.getByTestId('format-selector') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'story' } });
    expect(screen.getByTestId('canvas-editor').textContent).toBe('1080×1920');
  });

  it('default canvas is 1080x1080', async () => {
    const { AppShell } = await import('./AppShell');
    render(
      <FormatProvider>
        <AppShell />
      </FormatProvider>
    );
    expect(screen.getByTestId('canvas-editor').textContent).toBe('1080×1080');
  });
});
