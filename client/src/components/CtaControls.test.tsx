import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CtaControls } from './CtaControls';
import { useLayerStore } from '../store/layerStore';

vi.mock('fabric', () => ({
  Rect: vi.fn(),
}));

const makeCta = (overrides: Record<string, any> = {}) => ({
  id: 'cta1', type: 'cta' as const, name: 'CTA Button', zIndex: 0, visible: true, locked: false, opacity: 1, fabricObject: null,
  ctaStyle: { buttonColor: '#7c3aed', textContent: 'Shop Now', textColor: '#ffffff', cornerRadius: 8, paddingX: 32, paddingY: 12, ...overrides },
});

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
    useLayerStore.setState({ layers: [makeCta()], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    expect(screen.getByTestId('cta-controls')).toBeInTheDocument();
    expect(screen.getByTestId('cta-text-input')).toHaveValue('Shop Now');
    expect(screen.getByTestId('cta-color-input')).toHaveValue('#7c3aed');
    expect(screen.getByTestId('cta-radius-input')).toHaveValue(8);
  });

  it('updates text content in store', () => {
    useLayerStore.setState({ layers: [makeCta()], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    fireEvent.change(screen.getByTestId('cta-text-input'), { target: { value: 'Buy Now' } });
    expect(useLayerStore.getState().layers[0].ctaStyle?.textContent).toBe('Buy Now');
  });

  it('updates button color in store', () => {
    useLayerStore.setState({ layers: [makeCta()], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    fireEvent.change(screen.getByTestId('cta-color-input'), { target: { value: '#ff0000' } });
    expect(useLayerStore.getState().layers[0].ctaStyle?.buttonColor).toBe('#ff0000');
  });

  it('updates corner radius in store', () => {
    useLayerStore.setState({ layers: [makeCta()], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    fireEvent.change(screen.getByTestId('cta-radius-input'), { target: { value: '16' } });
    expect(useLayerStore.getState().layers[0].ctaStyle?.cornerRadius).toBe(16);
  });

  // --- Contrast indicator tests ---

  it('shows contrast ratio badge', () => {
    useLayerStore.setState({ layers: [makeCta()], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    const badge = screen.getByTestId('cta-contrast-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toMatch(/\d+\.\d+:1/);
  });

  it('shows green contrast badge when ratio >= 4.5 (white on dark purple)', () => {
    // #7c3aed (dark purple) vs #ffffff (white) should have high contrast
    useLayerStore.setState({ layers: [makeCta({ buttonColor: '#7c3aed', textColor: '#ffffff' })], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    const badge = screen.getByTestId('cta-contrast-badge');
    expect(badge.className).toContain('bg-green-900');
  });

  it('shows red contrast badge when ratio < 4.5 (yellow on white)', () => {
    useLayerStore.setState({ layers: [makeCta({ buttonColor: '#ffff00', textColor: '#ffffff' })], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    const badge = screen.getByTestId('cta-contrast-badge');
    expect(badge.className).toContain('bg-red-900');
  });

  it('updates contrast badge when text color changes', () => {
    useLayerStore.setState({ layers: [makeCta({ buttonColor: '#000000', textColor: '#ffffff' })], selectedLayerId: 'cta1' });
    const { rerender } = render(<CtaControls />);
    expect(screen.getByTestId('cta-contrast-badge').className).toContain('bg-green-900');

    // Change text color to something low-contrast
    fireEvent.change(screen.getByTestId('cta-text-color-input'), { target: { value: '#111111' } });
    rerender(<CtaControls />);
    expect(screen.getByTestId('cta-contrast-badge').className).toContain('bg-red-900');
  });

  // --- Padding controls tests ---

  it('renders padding X control with correct value', () => {
    useLayerStore.setState({ layers: [makeCta({ paddingX: 32 })], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    expect(screen.getByTestId('cta-padding-x-input')).toHaveValue(32);
  });

  it('renders padding Y control with correct value', () => {
    useLayerStore.setState({ layers: [makeCta({ paddingY: 12 })], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    expect(screen.getByTestId('cta-padding-y-input')).toHaveValue(12);
  });

  it('updates paddingX in store', () => {
    useLayerStore.setState({ layers: [makeCta()], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    fireEvent.change(screen.getByTestId('cta-padding-x-input'), { target: { value: '48' } });
    expect(useLayerStore.getState().layers[0].ctaStyle?.paddingX).toBe(48);
  });

  it('updates paddingY in store', () => {
    useLayerStore.setState({ layers: [makeCta()], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    fireEvent.change(screen.getByTestId('cta-padding-y-input'), { target: { value: '20' } });
    expect(useLayerStore.getState().layers[0].ctaStyle?.paddingY).toBe(20);
  });

  // --- Text color control test ---

  it('renders text color input', () => {
    useLayerStore.setState({ layers: [makeCta()], selectedLayerId: 'cta1' });
    render(<CtaControls />);
    expect(screen.getByTestId('cta-text-color-input')).toHaveValue('#ffffff');
  });
});
