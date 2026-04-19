import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptBar } from './PromptBar';
import { FormatProvider } from '../context/FormatContext';
import { GenerationProvider } from '../context/GenerationContext';
import { __resetArchetypesCacheForTests } from '../hooks/useArchetypes';

function renderPromptBar(onGenerated?: () => void) {
  return render(
    <FormatProvider>
      <GenerationProvider>
        <PromptBar onGenerated={onGenerated} />
      </GenerationProvider>
    </FormatProvider>
  );
}

// PromptBar mounts ArchetypeSelector, which fires `/api/archetypes`
// on mount. This helper installs a route-aware fetch stub: archetype
// calls resolve to an empty catalog; all other URLs walk the caller's
// supplied route map. This keeps the intent of each test visible
// (what the generate-ad / generate-image / generations calls return)
// without having to shim the mount-time archetype fetch inline.
function installRoutedFetch(routes: Record<string, Response | (() => Response | Promise<Response>)>) {
  vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const matchKey = Object.keys(routes).find((key) => url.includes(key));
    if (matchKey === undefined) {
      if (url.includes('/api/archetypes')) {
        return Promise.resolve(
          new Response(JSON.stringify({ archetypes: [] }), { status: 200 }),
        );
      }
      return Promise.reject(new Error(`Unstubbed fetch to ${url}`));
    }
    const resolver = routes[matchKey];
    const res = typeof resolver === 'function' ? resolver() : resolver;
    return Promise.resolve(res);
  });
}

describe('PromptBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    __resetArchetypesCacheForTests();
    // Default archetypes stub so tests that don't call installRoutedFetch
    // (smoke tests, validation tests, chip-render tests) still mount.
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/archetypes')) {
        return Promise.resolve(
          new Response(JSON.stringify({ archetypes: [] }), { status: 200 }),
        );
      }
      return Promise.reject(new Error(`Unstubbed fetch to ${url}`));
    });
  });

  it('renders prompt input and generate button', () => {
    renderPromptBar();
    expect(screen.getByTestId('prompt-input')).toBeInTheDocument();
    expect(screen.getByTestId('generate-button')).toBeInTheDocument();
  });

  it('shows validation error when clicking Generate with empty prompt', async () => {
    renderPromptBar();
    fireEvent.click(screen.getByTestId('generate-button'));
    expect(screen.getByTestId('validation-error')).toHaveTextContent(/add a prompt/i);
  });

  it('clears validation error when typing', () => {
    renderPromptBar();
    fireEvent.click(screen.getByTestId('generate-button'));
    expect(screen.getByTestId('validation-error')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('prompt-input'), { target: { value: 'test' } });
    expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument();
  });

  it('calls ad/image APIs and persists generation history', async () => {
    const adSpec = {
      imagePrompt: 'base creative brief',
      texts: { headline: 'H', subhead: 'S', cta: 'C' },
      colors: { primary: '#000', secondary: '#111', accent: '#222', text: '#fff', background: '#000' },
      templateId: 'bold-sale',
      metadata: {
        formatConfig: { width: 1080, height: 1350 },
        promptPipeline: {
          renderPrompt: 'MODEL RENDER PROMPT',
          systemPrompt: 'SYSTEM PROMPT',
        },
        model: { provider: 'google', name: 'gemini-3-pro-image-preview' },
      },
    };

    installRoutedFetch({
      '/api/generate-ad': new Response(JSON.stringify(adSpec), { status: 200 }),
      '/api/generate-image': new Response(
        JSON.stringify({ imageUrl: 'http://img.png' }),
        { status: 200 },
      ),
      '/api/generations': new Response(
        JSON.stringify({ generation: { id: 'gen-1' } }),
        { status: 201 },
      ),
    });
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

    const onGenerated = vi.fn();
    renderPromptBar(onGenerated);

    fireEvent.change(screen.getByTestId('prompt-input'), { target: { value: 'summer sale shoes' } });
    fireEvent.click(screen.getByTestId('generate-button'));

    // ad + image + history + mount-time archetypes = 4 total
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(4));

    const calls = fetchSpy.mock.calls.filter(([u]) => u !== '/api/archetypes');
    expect(calls[0][0]).toBe('/api/generate-ad');
    const adBody = JSON.parse(calls[0][1]?.body as string);
    expect(adBody.prompt).toBe('summer sale shoes');

    expect(calls[1][0]).toBe('/api/generate-image');
    const imageBody = JSON.parse(calls[1][1]?.body as string);
    expect(imageBody.prompt).toBe('base creative brief');
    expect(imageBody.width).toBe(1080);
    expect(imageBody.height).toBe(1350);
    expect(imageBody.enhancedPrompt).toBe('MODEL RENDER PROMPT');
    expect(imageBody.systemPrompt).toBe('SYSTEM PROMPT');
    expect(imageBody.model).toBe('gemini-3-pro-image-preview');

    expect(calls[2][0]).toBe('/api/generations');
    const historyBody = JSON.parse(calls[2][1]?.body as string);
    expect(historyBody.prompt).toBe('summer sale shoes');
    expect(historyBody.format).toBe('square');
    expect(historyBody.imagePrompt).toBe('base creative brief');
    expect(historyBody.model).toBe('gemini-3-pro-image-preview');
    expect(historyBody.imageUrl).toBe('http://img.png');

    await waitFor(() => expect(onGenerated).toHaveBeenCalledTimes(1));
  });

  it('disables generate button during loading', async () => {
    let resolveAd!: (response: Response) => void;
    installRoutedFetch({
      '/api/generate-ad': () =>
        new Promise<Response>((resolve) => {
          resolveAd = resolve;
        }),
      '/api/generate-image': new Response(
        JSON.stringify({ imageUrl: 'http://img.png' }),
        { status: 200 },
      ),
    });

    renderPromptBar();
    fireEvent.change(screen.getByTestId('prompt-input'), { target: { value: 'test' } });
    fireEvent.click(screen.getByTestId('generate-button'));

    await waitFor(() => {
      expect(screen.getByTestId('generate-button')).toBeDisabled();
    });

    resolveAd(
      new Response(
        JSON.stringify({
          imagePrompt: 'brief',
          texts: { headline: 'H', subhead: 'S', cta: 'C' },
          colors: { primary: '#000', secondary: '#111', accent: '#222', text: '#fff', background: '#000' },
          templateId: 'bold-sale',
        }),
        { status: 200 }
      )
    );
  });

  it('shows generation error when API fails', async () => {
    installRoutedFetch({
      '/api/generate-ad': new Response(
        JSON.stringify({ error: 'Bad request' }),
        { status: 400 },
      ),
    });

    renderPromptBar();
    fireEvent.change(screen.getByTestId('prompt-input'), { target: { value: 'test' } });
    fireEvent.click(screen.getByTestId('generate-button'));

    await waitFor(() => {
      expect(screen.getByTestId('generation-error')).toHaveTextContent('Bad request');
    });
  });

  it('renders fallback quick prompt chips when no archetype is selected', () => {
    renderPromptBar();
    expect(screen.getByText(/flash sale 30% off running shoes/i)).toBeInTheDocument();
    expect(screen.getByText(/new skincare serum/i)).toBeInTheDocument();
  });

  it("swaps chips to the selected archetype's example prompts", async () => {
    // Route the archetype catalog to include example prompts so the
    // selector can light up with them.
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/archetypes')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              archetypes: [
                {
                  id: 'luxury',
                  label: 'Luxury / Premium',
                  description: 'Editorial brief.',
                  examplePrompts: [
                    'Muted editorial still life of a hand-forged ring.',
                    'Cashmere overcoat draped on a linen chair, quiet room.',
                  ],
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.reject(new Error(`Unstubbed fetch to ${url}`));
    });

    renderPromptBar();

    // Before picking a category, fallback chips are visible.
    await waitFor(() => {
      expect(screen.getByText(/flash sale 30% off running shoes/i)).toBeInTheDocument();
    });

    // Pick luxury -> chips swap to the archetype's examples.
    await waitFor(() => {
      expect(screen.getByTestId('archetype-chip-luxury')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('archetype-chip-luxury'));

    await waitFor(() => {
      expect(screen.getByText(/hand-forged ring/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/flash sale 30% off running shoes/i)).not.toBeInTheDocument();

    // And the back-to-Auto chip restores the fallback.
    fireEvent.click(screen.getByTestId('archetype-chip-auto'));
    await waitFor(() => {
      expect(screen.getByText(/flash sale 30% off running shoes/i)).toBeInTheDocument();
    });
  });
});
