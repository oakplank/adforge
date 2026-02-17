import { useState } from 'react';
import { useFormat } from '../context/FormatContext';
import { useGeneration } from '../hooks/useGeneration';
import { useGenerationState } from '../context/GenerationContext';

export interface PromptBarProps {
  onGenerated?: (result: NonNullable<ReturnType<typeof useGeneration>['result']>) => void;
}

const QUICK_PROMPTS = [
  'PartingWord.com end-of-life messaging platform launch, compassionate modern aesthetic, dark green and light cream beige palette.',
  'Weekend flash sale 30% off running shoes for city commuters, kinetic energy, black + orange.',
  'New skincare serum for sensitive skin, clean minimal vibe, soft blue and white palette.',
];

export function PromptBar({ onGenerated }: PromptBarProps) {
  const [prompt, setPrompt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { format } = useFormat();
  const { isGenerating, error, generate } = useGeneration();
  const { setIsGenerating } = useGenerationState();

  async function handleGenerate() {
    setValidationError(null);

    if (!prompt.trim()) {
      setValidationError('Add a prompt so I can generate the ad.');
      return;
    }

    setIsGenerating(true);
    const result = await generate(prompt.trim(), format.id);
    setIsGenerating(false);

    if (result && onGenerated) {
      onGenerated(result);
    }
  }

  return (
    <footer className="prompt-shell" data-testid="prompt-bar">
      <div className="prompt-meta-row">
        <span className="prompt-hint">Single prompt input. We auto-tune style, quality, and safe zones.</span>
        <span className="prompt-format">Output: {format.label} {format.width}x{format.height}</span>
      </div>

      <div className="prompt-shortcuts">
        <span className="shortcut-badge">⌘/Ctrl + Enter: Generate</span>
        <span className="shortcut-badge">⌘/Ctrl + Z: Undo</span>
        <span className="shortcut-badge">⌘/Ctrl + Shift + Z or Y: Redo</span>
      </div>

      <div className="prompt-input-row">
        <textarea
          data-testid="prompt-input"
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value);
            setValidationError(null);
          }}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !isGenerating) {
              handleGenerate();
            }
          }}
          placeholder="Describe product, offer, audience, and vibe in one sentence. Example: 'New matte sunscreen for runners, sweatproof, launch offer 20% off, clean sporty look.'"
          className="prompt-input"
          rows={2}
        />

        <button
          data-testid="generate-button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="primary-button min-w-[130px] justify-center"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" data-testid="button-spinner">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Forging
            </span>
          ) : (
            'Forge Ad'
          )}
        </button>
      </div>

      <div className="prompt-chip-row">
        {QUICK_PROMPTS.map((quickPrompt) => (
          <button
            key={quickPrompt}
            type="button"
            className="prompt-chip"
            onClick={() => {
              setPrompt(quickPrompt);
              setValidationError(null);
            }}
          >
            {quickPrompt}
          </button>
        ))}
      </div>

      {validationError && (
        <span data-testid="validation-error" className="text-rose-300 text-xs">
          {validationError}
        </span>
      )}

      {error && !validationError && (
        <span data-testid="generation-error" className="text-rose-300 text-xs">
          {error}
        </span>
      )}
    </footer>
  );
}
