import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShapeControls } from './ShapeControls';
import { useLayerStore } from '../store/layerStore';

describe('ShapeControls', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('renders nothing when no shape layer selected', () => {
    const { container } = render(<ShapeControls />);
    expect(container.innerHTML).toBe('');
  });

  it('renders shape controls when shape layer is selected', () => {
    const mockObj = { set: () => {}, canvas: { requestRenderAll: () => {} } };
    const layerId = useLayerStore.getState().addLayer({ type: 'shape', name: 'Rectangle', fabricObject: mockObj as any });
    useLayerStore.getState().selectLayer(layerId);

    render(<ShapeControls />);
    expect(screen.getByTestId('shape-controls')).toBeTruthy();
    expect(screen.getByTestId('shape-fill-color')).toBeTruthy();
    expect(screen.getByTestId('shape-stroke-color')).toBeTruthy();
    expect(screen.getByTestId('shape-corner-radius')).toBeTruthy();
  });

  it('updates shape style when fill color changes', () => {
    const mockObj = { set: () => {}, canvas: { requestRenderAll: () => {} } };
    const layerId = useLayerStore.getState().addLayer({ type: 'shape', name: 'Rectangle', fabricObject: mockObj as any });
    useLayerStore.getState().selectLayer(layerId);

    render(<ShapeControls />);
    fireEvent.change(screen.getByTestId('shape-fill-color'), { target: { value: '#ff0000' } });

    const layer = useLayerStore.getState().layers.find((l) => l.id === layerId);
    expect(layer?.shapeStyle?.fill).toBe('#ff0000');
  });

  it('updates corner radius', () => {
    const mockObj = { set: () => {}, canvas: { requestRenderAll: () => {} } };
    const layerId = useLayerStore.getState().addLayer({ type: 'shape', name: 'Rectangle', fabricObject: mockObj as any });
    useLayerStore.getState().selectLayer(layerId);

    render(<ShapeControls />);
    fireEvent.change(screen.getByTestId('shape-corner-radius'), { target: { value: '12' } });

    const layer = useLayerStore.getState().layers.find((l) => l.id === layerId);
    expect(layer?.shapeStyle?.cornerRadius).toBe(12);
  });
});
