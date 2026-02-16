import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptBar } from './PromptBar';
import { FormatProvider } from '../context/FormatContext';
import { GenerationProvider } from '../context/GenerationContext';

function renderPromptBar(onGenerated?: () => void) {
  return render(
    <FormatProvider>
      <GenerationProvider>
        <PromptBar onGenerated={onGenerated} />
      </GenerationProvider>
    </FormatProvider>
  );
}

describe('PromptBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

  it('calls /api/generate-ad then /api/generate-image with tuned prompt payload', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

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

    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify(adSpec), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ imageUrl: 'http://img.png' }), { status: 200 }));

    const onGenerated = vi.fn();
    renderPromptBar(onGenerated);

    fireEvent.change(screen.getByTestId('prompt-input'), { target: { value: 'summer sale shoes' } });
    fireEvent.click(screen.getByTestId('generate-button'));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));

    expect(fetchSpy.mock.calls[0][0]).toBe('/api/generate-ad');
    const adBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(adBody.prompt).toBe('summer sale shoes');

    expect(fetchSpy.mock.calls[1][0]).toBe('/api/generate-image');
    const imageBody = JSON.parse(fetchSpy.mock.calls[1][1]?.body as string);
    expect(imageBody.prompt).toBe('base creative brief');
    expect(imageBody.width).toBe(1080);
    expect(imageBody.height).toBe(1350);
    expect(imageBody.enhancedPrompt).toBe('MODEL RENDER PROMPT');
    expect(imageBody.systemPrompt).toBe('SYSTEM PROMPT');
    expect(imageBody.model).toBe('gemini-3-pro-image-preview');

    await waitFor(() => expect(onGenerated).toHaveBeenCalledTimes(1));
  });

  it('disables generate button during loading', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    let resolveAd!: (response: Response) => void;

    fetchSpy
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAd = resolve;
          })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ imageUrl: 'http://img.png' }), { status: 200 }));

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
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 })
    );

    renderPromptBar();
    fireEvent.change(screen.getByTestId('prompt-input'), { target: { value: 'test' } });
    fireEvent.click(screen.getByTestId('generate-button'));

    await waitFor(() => {
      expect(screen.getByTestId('generation-error')).toHaveTextContent('Bad request');
    });
  });

  it('renders quick prompt chips', () => {
    renderPromptBar();
    expect(screen.getByText(/flash sale 30% off running shoes/i)).toBeInTheDocument();
    expect(screen.getByText(/new skincare serum/i)).toBeInTheDocument();
  });
});
