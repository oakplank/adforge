import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertiesPanel } from './PropertiesPanel';
import { useLayerStore } from '../store/layerStore';

describe('PropertiesPanel', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('shows no-selection message when no layer selected', () => {
    render(<PropertiesPanel />);
    expect(screen.getByTestId('no-selection-message')).toBeInTheDocument();
  });

  it('shows property fields when a layer is selected', () => {
    useLayerStore.setState({
      layers: [{
        id: 'l1', type: 'shape', name: 'Rect', zIndex: 0,
        visible: true, locked: false, opacity: 1, fabricObject: null,
        transform: { left: 10, top: 20, width: 100, height: 50, scaleX: 1, scaleY: 1, angle: 45 },
      }],
      selectedLayerId: 'l1',
    });

    render(<PropertiesPanel />);
    expect(screen.getByTestId('properties-fields')).toBeInTheDocument();
    expect(screen.getByTestId('prop-x')).toHaveValue(10);
    expect(screen.getByTestId('prop-y')).toHaveValue(20);
    expect(screen.getByTestId('prop-°')).toHaveValue(45);
  });

  it('displays computed width (width * scaleX)', () => {
    useLayerStore.setState({
      layers: [{
        id: 'l1', type: 'shape', name: 'Rect', zIndex: 0,
        visible: true, locked: false, opacity: 1, fabricObject: null,
        transform: { left: 0, top: 0, width: 100, height: 50, scaleX: 2, scaleY: 1, angle: 0 },
      }],
      selectedLayerId: 'l1',
    });

    render(<PropertiesPanel />);
    expect(screen.getByTestId('prop-w')).toHaveValue(200);
  });

  it('changing X updates transform in store', () => {
    useLayerStore.setState({
      layers: [{
        id: 'l1', type: 'shape', name: 'Rect', zIndex: 0,
        visible: true, locked: false, opacity: 1, fabricObject: null,
        transform: { left: 10, top: 20, width: 100, height: 50, scaleX: 1, scaleY: 1, angle: 0 },
      }],
      selectedLayerId: 'l1',
    });

    render(<PropertiesPanel />);
    fireEvent.change(screen.getByTestId('prop-x'), { target: { value: '50' } });

    const layer = useLayerStore.getState().layers[0];
    expect(layer.transform?.left).toBe(50);
  });

  it('changing X syncs to fabric object', () => {
    const mockSet = vi.fn();
    const mockRenderAll = vi.fn();
    const mockObj = {
      set: mockSet,
      canvas: { requestRenderAll: mockRenderAll },
    };

    useLayerStore.setState({
      layers: [{
        id: 'l1', type: 'shape', name: 'Rect', zIndex: 0,
        visible: true, locked: false, opacity: 1, fabricObject: mockObj as any,
        transform: { left: 10, top: 20, width: 100, height: 50, scaleX: 1, scaleY: 1, angle: 0 },
      }],
      selectedLayerId: 'l1',
    });

    render(<PropertiesPanel />);
    fireEvent.change(screen.getByTestId('prop-x'), { target: { value: '99' } });

    expect(mockSet).toHaveBeenCalledWith('left', 99);
    expect(mockRenderAll).toHaveBeenCalled();
  });

  it('opacity slider updates store and fabric object', () => {
    const mockSet = vi.fn();
    const mockRenderAll = vi.fn();
    const mockObj = {
      set: mockSet,
      canvas: { requestRenderAll: mockRenderAll },
    };

    useLayerStore.setState({
      layers: [{
        id: 'l1', type: 'shape', name: 'Rect', zIndex: 0,
        visible: true, locked: false, opacity: 1, fabricObject: mockObj as any,
        transform: { left: 0, top: 0, width: 100, height: 50, scaleX: 1, scaleY: 1, angle: 0 },
      }],
      selectedLayerId: 'l1',
    });

    render(<PropertiesPanel />);
    fireEvent.change(screen.getByTestId('prop-opacity'), { target: { value: '0.5' } });

    const layer = useLayerStore.getState().layers[0];
    expect(layer.opacity).toBe(0.5);
    expect(mockSet).toHaveBeenCalledWith('opacity', 0.5);
    expect(mockRenderAll).toHaveBeenCalled();
  });

  it('canvas changes reflected in panel (bidirectional sync)', () => {
    useLayerStore.setState({
      layers: [{
        id: 'l1', type: 'shape', name: 'Rect', zIndex: 0,
        visible: true, locked: false, opacity: 1, fabricObject: null,
        transform: { left: 10, top: 20, width: 100, height: 50, scaleX: 1, scaleY: 1, angle: 0 },
      }],
      selectedLayerId: 'l1',
    });

    const { rerender } = render(<PropertiesPanel />);
    expect(screen.getByTestId('prop-x')).toHaveValue(10);

    // Simulate canvas updating the store (as useCanvasManipulation does)
    useLayerStore.getState().updateLayerTransform('l1', {
      left: 77, top: 88, width: 100, height: 50, scaleX: 1, scaleY: 1, angle: 0,
    });

    rerender(<PropertiesPanel />);
    expect(screen.getByTestId('prop-x')).toHaveValue(77);
    expect(screen.getByTestId('prop-y')).toHaveValue(88);
  });

  it('opacity clamps to 0-1 range in store', () => {
    useLayerStore.setState({
      layers: [{
        id: 'l1', type: 'shape', name: 'Rect', zIndex: 0,
        visible: true, locked: false, opacity: 1, fabricObject: null,
      }],
      selectedLayerId: 'l1',
    });

    useLayerStore.getState().updateLayerOpacity('l1', 1.5);
    expect(useLayerStore.getState().layers[0].opacity).toBe(1);

    useLayerStore.getState().updateLayerOpacity('l1', -0.5);
    expect(useLayerStore.getState().layers[0].opacity).toBe(0);
  });
});
