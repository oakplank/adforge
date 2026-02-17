import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayersPanel } from './LayersPanel';
import { useLayerStore } from '../store/layerStore';

describe('LayersPanel', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('shows empty state when no layers', () => {
    render(<LayersPanel />);
    expect(screen.getByText('No layers yet')).toBeTruthy();
  });

  it('lists layers', () => {
    useLayerStore.getState().addLayer({ type: 'image', name: 'Hero Image', fabricObject: null });
    useLayerStore.getState().addLayer({ type: 'text', name: 'Headline', fabricObject: null });
    render(<LayersPanel />);
    expect(screen.getByText('Hero Image')).toBeTruthy();
    expect(screen.getByText('Headline')).toBeTruthy();
  });

  it('selects a layer on click', () => {
    const id = useLayerStore.getState().addLayer({ type: 'text', name: 'Title', fabricObject: null });
    render(<LayersPanel />);
    fireEvent.click(screen.getByText('Title'));
    expect(useLayerStore.getState().selectedLayerId).toBe(id);
  });

  it('deletes a layer', () => {
    const id = useLayerStore.getState().addLayer({ type: 'shape', name: 'Box', fabricObject: null });
    render(<LayersPanel />);
    fireEvent.click(screen.getByTestId(`delete-layer-${id}`));
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it('toggles visibility', () => {
    const id = useLayerStore.getState().addLayer({ type: 'image', name: 'Img', fabricObject: null });
    render(<LayersPanel />);
    fireEvent.click(screen.getByTestId(`visibility-toggle-${id}`));
    expect(useLayerStore.getState().layers[0].visible).toBe(false);
  });
});
