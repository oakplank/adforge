import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TypographyControls } from './TypographyControls';
import { useLayerStore } from '../store/layerStore';
import { BRAND_TEXT_PRESETS } from '../types/layers';
import type { TextStyle } from '../types/layers';

const baseTextStyle: TextStyle = {
  fontFamily: 'Space Grotesk',
  fontSize: 48,
  fill: '#ffffff',
  fontWeight: 'normal',
  fontStyle: 'normal',
  underline: false,
  textAlign: 'left',
  shadow: null,
};

function setupTextLayer(overrides?: Partial<TextStyle>, fabricObject: any = null) {
  useLayerStore.setState({
    layers: [{
      id: 'l1', type: 'text', name: 'Text', zIndex: 0,
      visible: true, locked: false, opacity: 1,
      fabricObject,
      textStyle: { ...baseTextStyle, ...overrides },
    }],
    selectedLayerId: 'l1',
  });
}

describe('TypographyControls', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('does not render when no layer selected', () => {
    render(<TypographyControls />);
    expect(screen.queryByTestId('typography-controls')).not.toBeInTheDocument();
  });

  it('does not render for non-text layer', () => {
    useLayerStore.setState({
      layers: [{
        id: 'l1', type: 'shape', name: 'Rect', zIndex: 0,
        visible: true, locked: false, opacity: 1, fabricObject: null,
      }],
      selectedLayerId: 'l1',
    });
    render(<TypographyControls />);
    expect(screen.queryByTestId('typography-controls')).not.toBeInTheDocument();
  });

  it('renders typography controls for text layer', () => {
    setupTextLayer();
    render(<TypographyControls />);
    expect(screen.getByTestId('typography-controls')).toBeInTheDocument();
    expect(screen.getByTestId('typo-font-family')).toHaveValue('Space Grotesk');
    expect(screen.getByTestId('typo-font-size')).toHaveValue(48);
  });

  it('font family change updates store', () => {
    setupTextLayer();
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-font-family'), { target: { value: 'Manrope' } });
    expect(useLayerStore.getState().layers[0].textStyle?.fontFamily).toBe('Manrope');
  });

  it('font size change updates store', () => {
    setupTextLayer();
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-font-size'), { target: { value: '24' } });
    expect(useLayerStore.getState().layers[0].textStyle?.fontSize).toBe(24);
  });

  it('color change updates store', () => {
    setupTextLayer();
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-color'), { target: { value: '#ff0000' } });
    expect(useLayerStore.getState().layers[0].textStyle?.fill).toBe('#ff0000');
  });

  it('bold toggle works', () => {
    setupTextLayer();
    const { rerender } = render(<TypographyControls />);
    fireEvent.click(screen.getByTestId('typo-bold'));
    expect(useLayerStore.getState().layers[0].textStyle?.fontWeight).toBe('bold');
    rerender(<TypographyControls />);
    fireEvent.click(screen.getByTestId('typo-bold'));
    expect(useLayerStore.getState().layers[0].textStyle?.fontWeight).toBe('normal');
  });

  it('italic toggle works', () => {
    setupTextLayer();
    render(<TypographyControls />);
    fireEvent.click(screen.getByTestId('typo-italic'));
    expect(useLayerStore.getState().layers[0].textStyle?.fontStyle).toBe('italic');
  });

  it('underline toggle works', () => {
    setupTextLayer();
    render(<TypographyControls />);
    fireEvent.click(screen.getByTestId('typo-underline'));
    expect(useLayerStore.getState().layers[0].textStyle?.underline).toBe(true);
  });

  it('text alignment changes', () => {
    setupTextLayer();
    render(<TypographyControls />);
    fireEvent.click(screen.getByTestId('typo-align-center'));
    expect(useLayerStore.getState().layers[0].textStyle?.textAlign).toBe('center');
    fireEvent.click(screen.getByTestId('typo-align-right'));
    expect(useLayerStore.getState().layers[0].textStyle?.textAlign).toBe('right');
  });

  it('shadow toggle enables shadow with defaults', () => {
    setupTextLayer();
    render(<TypographyControls />);
    fireEvent.click(screen.getByTestId('typo-shadow-toggle'));
    const shadow = useLayerStore.getState().layers[0].textStyle?.shadow;
    expect(shadow).toBeTruthy();
    expect(shadow?.offsetX).toBe(2);
    expect(shadow?.blur).toBe(4);
  });

  it('shadow controls update shadow values', () => {
    setupTextLayer({ shadow: { offsetX: 2, offsetY: 2, blur: 4, color: '#000000' } });
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-shadow-x'), { target: { value: '5' } });
    expect(useLayerStore.getState().layers[0].textStyle?.shadow?.offsetX).toBe(5);
    fireEvent.change(screen.getByTestId('typo-shadow-blur'), { target: { value: '8' } });
    expect(useLayerStore.getState().layers[0].textStyle?.shadow?.blur).toBe(8);
  });

  it('syncs changes to fabric object', () => {
    const mockSet = vi.fn();
    const mockRenderAll = vi.fn();
    const mockObj = { set: mockSet, canvas: { requestRenderAll: mockRenderAll } };
    setupTextLayer({}, mockObj);
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-font-size'), { target: { value: '32' } });
    expect(mockSet).toHaveBeenCalledWith('fontSize', 32);
    expect(mockRenderAll).toHaveBeenCalled();
  });

  it('disabling shadow sets it to null', () => {
    setupTextLayer({ shadow: { offsetX: 2, offsetY: 2, blur: 4, color: '#000000' } });
    render(<TypographyControls />);
    fireEvent.click(screen.getByTestId('typo-shadow-toggle'));
    expect(useLayerStore.getState().layers[0].textStyle?.shadow).toBeNull();
  });

  // Token Role tests
  it('renders token role dropdown with all options', () => {
    setupTextLayer();
    render(<TypographyControls />);
    const select = screen.getByTestId('typo-token-role');
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll('option');
    const values = Array.from(options).map((o) => o.value);
    expect(values).toEqual(['headline', 'subhead', 'body', 'custom']);
  });

  it('defaults to custom when no tokenRole set', () => {
    setupTextLayer();
    render(<TypographyControls />);
    expect(screen.getByTestId('typo-token-role')).toHaveValue('custom');
  });

  it('selecting headline role applies preset fontFamily, fontWeight and constrains size', () => {
    setupTextLayer({ fontSize: 48 });
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-token-role'), { target: { value: 'headline' } });
    const s = useLayerStore.getState().layers[0].textStyle!;
    expect(s.tokenRole).toBe('headline');
    expect(s.fontFamily).toBe(BRAND_TEXT_PRESETS.headline.fontFamily);
    expect(s.fontWeight).toBe(BRAND_TEXT_PRESETS.headline.fontWeight);
    expect(s.fontSize).toBeGreaterThanOrEqual(BRAND_TEXT_PRESETS.headline.fontSizeMin);
    expect(s.fontSize).toBeLessThanOrEqual(BRAND_TEXT_PRESETS.headline.fontSizeMax);
  });

  it('selecting headline clamps font size to max when too large', () => {
    setupTextLayer({ fontSize: 200 });
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-token-role'), { target: { value: 'headline' } });
    expect(useLayerStore.getState().layers[0].textStyle!.fontSize).toBe(BRAND_TEXT_PRESETS.headline.fontSizeMax);
  });

  it('selecting body clamps font size to min when too small', () => {
    setupTextLayer({ fontSize: 5 });
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-token-role'), { target: { value: 'body' } });
    expect(useLayerStore.getState().layers[0].textStyle!.fontSize).toBe(BRAND_TEXT_PRESETS.body.fontSizeMin);
  });

  it('headline role constrains font size input min/max', () => {
    setupTextLayer({ tokenRole: 'headline', fontSize: 48 });
    render(<TypographyControls />);
    const sizeInput = screen.getByTestId('typo-font-size');
    expect(sizeInput).toHaveAttribute('min', String(BRAND_TEXT_PRESETS.headline.fontSizeMin));
    expect(sizeInput).toHaveAttribute('max', String(BRAND_TEXT_PRESETS.headline.fontSizeMax));
  });

  it('custom role allows unconstrained font size (1-500)', () => {
    setupTextLayer();
    render(<TypographyControls />);
    const sizeInput = screen.getByTestId('typo-font-size');
    expect(sizeInput).toHaveAttribute('min', '1');
    expect(sizeInput).toHaveAttribute('max', '500');
  });

  it('switching to custom clears tokenRole', () => {
    setupTextLayer({ tokenRole: 'headline', fontSize: 48 });
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-token-role'), { target: { value: 'custom' } });
    expect(useLayerStore.getState().layers[0].textStyle!.tokenRole).toBeUndefined();
  });

  it('selecting subhead applies subhead preset', () => {
    setupTextLayer({ fontSize: 24 });
    render(<TypographyControls />);
    fireEvent.change(screen.getByTestId('typo-token-role'), { target: { value: 'subhead' } });
    const s = useLayerStore.getState().layers[0].textStyle!;
    expect(s.fontFamily).toBe(BRAND_TEXT_PRESETS.subhead.fontFamily);
    expect(s.fontWeight).toBe(BRAND_TEXT_PRESETS.subhead.fontWeight);
  });
});
