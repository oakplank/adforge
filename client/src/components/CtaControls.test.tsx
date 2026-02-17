import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CtaControls } from './CtaControls';
import { useLayerStore } from '../store/layerStore';

vi.mock('fabric', () => ({
  Rect: vi.fn(),
}));

describe('CtaControls', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('renders nothing when no CTA layer is selected', () => {
    const { container } = render(<CtaControls />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when a non-CTA layer is selected', () => {
    useLayerStore.setState({
      layers: [{ id: 'l1', type: 'text', name: 'Text', zIndex: 0, visible: true, locked: false, opacity: 1, fabricObject: null }],
      selectedLayerId: 'l1',
    });
    const { container } = render(<CtaControls />);
    expect(container.innerHTML).toBe('');
  });

  it('renders CTA controls when a CTA layer is selected', () => {
    useLayerStore.setState({
      layers: [{
        id: 'cta1', type: 'cta', name: 'CTA Button', zIndex: 0, visible: true, locked: false, opacity: 1, fabricObject: null,
        ctaStyle: { buttonColor: '#7c3aed', textContent: 'Shop Now', textColor: '#ffffff', cornerRadius: 8, paddingX: 32, paddingY: 12 },
      }],
      selectedLayerId: 'cta1',
    });
    render(<CtaControls />);
    expect(screen.getByTestId('cta-controls')).toBeInTheDocument();
    expect(screen.getByTestId('cta-text-input')).toHaveValue('Shop Now');
    expect(screen.getByTestId('cta-color-input')).toHaveValue('#7c3aed');
    expect(screen.getByTestId('cta-radius-input')).toHaveValue(8);
  });

  it('updates text content in store', () => {
    useLayerStore.setState({
      layers: [{
        id: 'cta1', type: 'cta', name: 'CTA Button', zIndex: 0, visible: true, locked: false, opacity: 1, fabricObject: null,
        ctaStyle: { buttonColor: '#7c3aed', textContent: 'Shop Now', textColor: '#ffffff', cornerRadius: 8, paddingX: 32, paddingY: 12 },
      }],
      selectedLayerId: 'cta1',
    });
    render(<CtaControls />);
    fireEvent.change(screen.getByTestId('cta-text-input'), { target: { value: 'Buy Now' } });

    const layer = useLayerStore.getState().layers[0];
    expect(layer.ctaStyle?.textContent).toBe('Buy Now');
  });

  it('updates button color in store', () => {
    useLayerStore.setState({
      layers: [{
        id: 'cta1', type: 'cta', name: 'CTA Button', zIndex: 0, visible: true, locked: false, opacity: 1, fabricObject: null,
        ctaStyle: { buttonColor: '#7c3aed', textContent: 'Shop Now', textColor: '#ffffff', cornerRadius: 8, paddingX: 32, paddingY: 12 },
      }],
      selectedLayerId: 'cta1',
    });
    render(<CtaControls />);
    fireEvent.change(screen.getByTestId('cta-color-input'), { target: { value: '#ff0000' } });

    const layer = useLayerStore.getState().layers[0];
    expect(layer.ctaStyle?.buttonColor).toBe('#ff0000');
  });

  it('updates corner radius in store', () => {
    useLayerStore.setState({
      layers: [{
        id: 'cta1', type: 'cta', name: 'CTA Button', zIndex: 0, visible: true, locked: false, opacity: 1, fabricObject: null,
        ctaStyle: { buttonColor: '#7c3aed', textContent: 'Shop Now', textColor: '#ffffff', cornerRadius: 8, paddingX: 32, paddingY: 12 },
      }],
      selectedLayerId: 'cta1',
    });
    render(<CtaControls />);
    fireEvent.change(screen.getByTestId('cta-radius-input'), { target: { value: '16' } });

    const layer = useLayerStore.getState().layers[0];
    expect(layer.ctaStyle?.cornerRadius).toBe(16);
  });
});
