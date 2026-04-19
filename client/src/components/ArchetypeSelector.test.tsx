import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArchetypeSelector } from './ArchetypeSelector';
import { GenerationProvider, useGenerationState } from '../context/GenerationContext';
import { __resetArchetypesCacheForTests } from '../hooks/useArchetypes';

const archetypes = [
  {
    id: 'product-launch',
    label: 'Product Launch',
    description: 'Launch brief.',
    examplePrompts: ['Launch example A prompt here for testing.'],
  },
  {
    id: 'sale-offer',
    label: 'Sale / Offer',
    description: 'Urgency brief.',
    examplePrompts: ['Sale example prompt for a red-and-black flash offer.'],
  },
  {
    id: 'luxury',
    label: 'Luxury / Premium',
    description: 'Editorial brief.',
    examplePrompts: ['Luxury example prompt for a muted editorial still life.'],
  },
];

function mockArchetypesFetch() {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ archetypes }), { status: 200 }),
  );
}

function SelectedProbe() {
  const { selectedArchetypeId } = useGenerationState();
  return (
    <span data-testid="selected-archetype">{selectedArchetypeId ?? 'null'}</span>
  );
}

describe('ArchetypeSelector', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    __resetArchetypesCacheForTests();
  });

  it('renders an Auto chip plus fetched archetypes', async () => {
    mockArchetypesFetch();
    render(
      <GenerationProvider>
        <ArchetypeSelector />
      </GenerationProvider>,
    );

    expect(screen.getByTestId('archetype-chip-auto')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('archetype-chip-product-launch')).toBeInTheDocument();
    });
    expect(screen.getByTestId('archetype-chip-sale-offer')).toBeInTheDocument();
    expect(screen.getByTestId('archetype-chip-luxury')).toBeInTheDocument();
  });

  it('defaults to Auto selected and updates context on click', async () => {
    mockArchetypesFetch();
    render(
      <GenerationProvider>
        <ArchetypeSelector />
        <SelectedProbe />
      </GenerationProvider>,
    );

    expect(screen.getByTestId('selected-archetype').textContent).toBe('null');
    expect(screen.getByTestId('archetype-chip-auto').getAttribute('data-selected')).toBe(
      'true',
    );

    await waitFor(() => {
      expect(screen.getByTestId('archetype-chip-luxury')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('archetype-chip-luxury'));
    expect(screen.getByTestId('selected-archetype').textContent).toBe('luxury');
    expect(screen.getByTestId('archetype-chip-luxury').getAttribute('data-selected')).toBe(
      'true',
    );
    expect(screen.getByTestId('archetype-chip-auto').getAttribute('data-selected')).toBe(
      'false',
    );
  });

  it('Auto chip clears a prior selection', async () => {
    mockArchetypesFetch();
    render(
      <GenerationProvider>
        <ArchetypeSelector />
        <SelectedProbe />
      </GenerationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('archetype-chip-sale-offer')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('archetype-chip-sale-offer'));
    expect(screen.getByTestId('selected-archetype').textContent).toBe('sale-offer');

    fireEvent.click(screen.getByTestId('archetype-chip-auto'));
    expect(screen.getByTestId('selected-archetype').textContent).toBe('null');
  });

  it('shows an error message when the archetypes API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('nope', { status: 500 }),
    );

    render(
      <GenerationProvider>
        <ArchetypeSelector />
      </GenerationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('archetype-selector-error')).toBeInTheDocument();
    });
  });
});
