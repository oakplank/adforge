import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackgroundControls } from './BackgroundControls';
import { useLayerStore } from '../store/layerStore';
import { DEFAULT_BACKGROUND_STYLE } from '../types/shapes';

describe('BackgroundControls', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('renders nothing when no background layer selected', () => {
    const { container } = render(<BackgroundControls canvas={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders background controls when background layer is selected', () => {
    const mockObj = { set: () => {}, canvas: { requestRenderAll: () => {} } };
    const id = useLayerStore.getState().addLayer({ type: 'background', name: 'Background', fabricObject: mockObj as any });
    useLayerStore.getState().selectLayer(id);
    useLayerStore.getState().updateBackgroundStyle(id, DEFAULT_BACKGROUND_STYLE);

    render(<BackgroundControls canvas={null} />);
    expect(screen.getByTestId('background-controls')).toBeTruthy();
    expect(screen.getByTestId('background-type-select')).toBeTruthy();
  });

  it('shows color picker for solid type', () => {
    const mockObj = { set: () => {}, canvas: { requestRenderAll: () => {} } };
    const id = useLayerStore.getState().addLayer({ type: 'background', name: 'Background', fabricObject: mockObj as any });
    useLayerStore.getState().selectLayer(id);
    useLayerStore.getState().updateBackgroundStyle(id, { type: 'solid', color: '#1e1e2e' });

    render(<BackgroundControls canvas={null} />);
    expect(screen.getByTestId('background-color')).toBeTruthy();
  });

  it('switches to gradient and shows gradient controls', () => {
    const mockObj = { set: () => {}, canvas: { requestRenderAll: () => {} } };
    const id = useLayerStore.getState().addLayer({ type: 'background', name: 'Background', fabricObject: mockObj as any });
    useLayerStore.getState().selectLayer(id);
    useLayerStore.getState().updateBackgroundStyle(id, { type: 'solid', color: '#1e1e2e' });

    render(<BackgroundControls canvas={null} />);
    fireEvent.change(screen.getByTestId('background-type-select'), { target: { value: 'gradient' } });

    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer?.backgroundStyle?.type).toBe('gradient');
    expect(layer?.backgroundStyle?.gradient).toBeTruthy();
  });
});
