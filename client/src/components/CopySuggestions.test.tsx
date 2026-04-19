import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import { GenerationProvider, useGenerationState } from '../context/GenerationContext';
import { CopySuggestions } from './CopySuggestions';
import { useLayerStore } from '../store/layerStore';
import type { AdSpec } from '../hooks/useGeneration';

vi.mock('fabric', () => {
  const MockIText = vi.fn().mockImplementation((text, opts) => ({
    type: 'i-text',
    text,
    width: 120,
    height: 40,
    ...opts,
  }));
  const MockRect = vi.fn().mockImplementation((opts) => ({ type: 'rect', ...opts }));
  const MockGroup = vi.fn().mockImplementation((children, opts) => ({
    type: 'group',
    children,
    ...opts,
  }));
  const MockShadow = vi.fn().mockImplementation((opts) => ({ __shadow: true, ...opts }));
  return { IText: MockIText, Rect: MockRect, Group: MockGroup, Shadow: MockShadow };
});

vi.mock('../utils/canvasContrast', () => ({
  sampleRegionContrast: vi.fn().mockReturnValue({
    fill: '#ffffff',
    needsShadow: false,
    averageLuminance: 50,
    luminanceStdDev: 10,
  }),
}));

const testAdSpec: AdSpec = {
  imagePrompt: 'test',
  texts: {
    headline: '"Run the city"',
    subhead: 'Pavement-first trainers built for 5am commutes.',
    cta: 'Shop the lineup',
  },
  colors: {
    primary: '#111111',
    secondary: '#eeeeee',
    accent: '#ff6a3d',
    text: '#ffffff',
    background: '#000000',
  },
  templateId: 'product-showcase',
};

function AdSpecSeeder({ spec, children }: { spec: AdSpec; children: ReactNode }) {
  const { setLastAdSpec } = useGenerationState();
  useEffect(() => {
    setLastAdSpec(spec);
  }, [setLastAdSpec, spec]);
  return <>{children}</>;
}

function makeCanvas() {
  return {
    width: 1080,
    height: 1080,
    add: vi.fn(),
    setActiveObject: vi.fn(),
    renderAll: vi.fn(),
  };
}

describe('CopySuggestions', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  it('shows empty state when no generation has happened', () => {
    render(
      <GenerationProvider>
        <CopySuggestions canvas={null} />
      </GenerationProvider>,
    );
    expect(screen.getByTestId('copy-suggestions-empty')).toBeInTheDocument();
  });

  it('renders chips with cleaned copy after generation', () => {
    render(
      <GenerationProvider>
        <AdSpecSeeder spec={testAdSpec}>
          <CopySuggestions canvas={null} />
        </AdSpecSeeder>
      </GenerationProvider>,
    );

    const headlineChip = screen.getByTestId('copy-chip-headline');
    // Wrapping quotes trimmed by cleanCopy.
    expect(headlineChip.textContent).toContain('Run the city');
    expect(headlineChip.textContent).not.toContain('"Run the city"');

    expect(screen.getByTestId('copy-chip-subhead').textContent).toContain(
      'Pavement-first',
    );
    expect(screen.getByTestId('copy-chip-cta').textContent).toContain(
      'Shop the lineup',
    );
  });

  it('inserts a pre-styled headline layer when clicked', () => {
    const canvas = makeCanvas();
    render(
      <GenerationProvider>
        <AdSpecSeeder spec={testAdSpec}>
          <CopySuggestions canvas={canvas as never} />
        </AdSpecSeeder>
      </GenerationProvider>,
    );

    fireEvent.click(screen.getByTestId('copy-chip-headline'));

    expect(canvas.add).toHaveBeenCalledTimes(1);
    const added = canvas.add.mock.calls[0][0];
    expect(added.text).toBe('Run the city');
    expect(added.fontWeight).toBe('bold');
    expect(added.fontSize).toBeGreaterThan(60);

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(1);
    expect(layers[0].type).toBe('text');
    expect(layers[0].name).toBe('Headline');
  });

  it('inserts a CTA as a grouped pill using the accent color', () => {
    const canvas = makeCanvas();
    render(
      <GenerationProvider>
        <AdSpecSeeder spec={testAdSpec}>
          <CopySuggestions canvas={canvas as never} />
        </AdSpecSeeder>
      </GenerationProvider>,
    );

    fireEvent.click(screen.getByTestId('copy-chip-cta'));

    expect(canvas.add).toHaveBeenCalledTimes(1);
    const added = canvas.add.mock.calls[0][0];
    expect(added.type).toBe('group');
    const pill = added.children[0];
    expect(pill.fill).toBe('#ff6a3d');
    const layers = useLayerStore.getState().layers;
    expect(layers[0].type).toBe('cta');
    expect(layers[0].name).toBe('CTA');
  });

  it('disables chips when canvas is null', () => {
    render(
      <GenerationProvider>
        <AdSpecSeeder spec={testAdSpec}>
          <CopySuggestions canvas={null} />
        </AdSpecSeeder>
      </GenerationProvider>,
    );
    expect(screen.getByTestId('copy-chip-headline')).toBeDisabled();
  });

  it('uses archetype display font for the inserted headline', () => {
    // When the adSpec ships an archetype font stack, the inserted IText
    // layer must pick that up — otherwise the "pick luxury, see serif"
    // promise silently breaks.
    const luxurySpec: AdSpec = {
      ...testAdSpec,
      archetypeId: 'luxury',
      fonts: {
        display: '"Playfair Display", Georgia, serif',
        body: '"Inter", system-ui, sans-serif',
      },
    };
    const canvas = makeCanvas();
    render(
      <GenerationProvider>
        <AdSpecSeeder spec={luxurySpec}>
          <CopySuggestions canvas={canvas as never} />
        </AdSpecSeeder>
      </GenerationProvider>,
    );

    fireEvent.click(screen.getByTestId('copy-chip-headline'));
    const added = canvas.add.mock.calls[0][0];
    expect(added.fontFamily).toBe('"Playfair Display", Georgia, serif');
  });

  it('uses archetype body font for subhead + CTA inserts', () => {
    const saleSpec: AdSpec = {
      ...testAdSpec,
      archetypeId: 'sale-offer',
      fonts: {
        display: '"Anton", Impact, sans-serif',
        body: '"Inter", Arial, sans-serif',
      },
    };
    const canvas = makeCanvas();
    render(
      <GenerationProvider>
        <AdSpecSeeder spec={saleSpec}>
          <CopySuggestions canvas={canvas as never} />
        </AdSpecSeeder>
      </GenerationProvider>,
    );

    fireEvent.click(screen.getByTestId('copy-chip-subhead'));
    const subheadObj = canvas.add.mock.calls[0][0];
    expect(subheadObj.fontFamily).toBe('"Inter", Arial, sans-serif');

    fireEvent.click(screen.getByTestId('copy-chip-cta'));
    const ctaGroup = canvas.add.mock.calls[1][0];
    // CTA text is the second child of the group (pill first).
    expect(ctaGroup.children[1].fontFamily).toBe('"Inter", Arial, sans-serif');
  });

  it('falls back to Space Grotesk when the spec has no fonts (pre-archetype generations)', () => {
    // Generations saved before the font field shipped must still insert
    // legibly — we fall back to the original hardcoded default.
    const canvas = makeCanvas();
    render(
      <GenerationProvider>
        <AdSpecSeeder spec={testAdSpec}>
          <CopySuggestions canvas={canvas as never} />
        </AdSpecSeeder>
      </GenerationProvider>,
    );

    fireEvent.click(screen.getByTestId('copy-chip-headline'));
    const added = canvas.add.mock.calls[0][0];
    expect(added.fontFamily).toContain('Space Grotesk');
  });
});
