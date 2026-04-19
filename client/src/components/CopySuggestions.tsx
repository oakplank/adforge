import { useCallback } from 'react';
import { IText, Rect, Group, Shadow, type Canvas } from 'fabric';
import { useGenerationState } from '../context/GenerationContext';
import { useLayerStore } from '../store/layerStore';
import { sampleRegionContrast } from '../utils/canvasContrast';

// The wrapper's value-add after the image is generated: one-click insert
// of the AI-written headline, subhead, and CTA copy as pre-styled, editable
// layers. Nothing is auto-stamped — the user picks which pieces to use, and
// edits them in place. Contrast-aware so they're legible over whatever the
// model actually produced.

interface CopySuggestionsProps {
  canvas: Canvas | null;
}

type CopyKind = 'headline' | 'subhead' | 'cta';

// Trim obvious wrapping quotes from LLM-returned copy so users don't see
// "Run faster." with quotes on the canvas.
function cleanCopy(raw: string | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('“') && trimmed.endsWith('”')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function headlineSize(canvasWidth: number): number {
  const scaled = Math.round(canvasWidth * 0.085);
  return Math.min(160, Math.max(48, scaled));
}

function subheadSize(canvasWidth: number): number {
  const scaled = Math.round(canvasWidth * 0.032);
  return Math.min(60, Math.max(20, scaled));
}

function ctaTextSize(canvasWidth: number): number {
  const scaled = Math.round(canvasWidth * 0.028);
  return Math.min(52, Math.max(18, scaled));
}

export function CopySuggestions({ canvas }: CopySuggestionsProps) {
  const { lastAdSpec } = useGenerationState();
  const addLayer = useLayerStore((s) => s.addLayer);
  const selectLayer = useLayerStore((s) => s.selectLayer);

  const headline = cleanCopy(lastAdSpec?.texts?.headline);
  const subhead = cleanCopy(lastAdSpec?.texts?.subhead);
  const ctaText = cleanCopy(lastAdSpec?.texts?.cta);
  const accent = lastAdSpec?.colors?.accent || '#ff6a3d';

  const insertText = useCallback(
    (kind: CopyKind) => {
      if (!canvas) return;
      const canvasWidth = canvas.width ?? 1080;
      const canvasHeight = canvas.height ?? 1080;

      const verticalBias =
        kind === 'headline' ? 0.28 : kind === 'subhead' ? 0.42 : 0.82;
      const fontSize =
        kind === 'headline'
          ? headlineSize(canvasWidth)
          : kind === 'subhead'
            ? subheadSize(canvasWidth)
            : ctaTextSize(canvasWidth);

      const left = canvasWidth / 2;
      const top = canvasHeight * verticalBias;

      // Sample under the intended drop region to pick contrast.
      const sampleRect = {
        left: Math.round(canvasWidth * 0.1),
        top: Math.round(top - fontSize * 0.6),
        width: Math.round(canvasWidth * 0.8),
        height: Math.round(fontSize * 1.4),
      };
      const contrast = sampleRegionContrast(canvas, sampleRect);

      if (kind === 'cta') {
        // CTA is a pill with centered text. We use the accent color from the
        // adSpec palette for the button and pick pill-text color from the
        // accent's luminance, not the image behind it.
        const label = ctaText || 'Shop Now';
        const textColor = pickReadableOn(accent);
        const text = new IText(label, {
          fontSize,
          fill: textColor,
          fontFamily: 'Space Grotesk, Inter, system-ui, sans-serif',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center',
        });
        const textWidth = text.width ?? 140;
        const textHeight = text.height ?? 32;
        const paddingX = Math.round(fontSize * 1.1);
        const paddingY = Math.round(fontSize * 0.55);
        const pill = new Rect({
          width: textWidth + paddingX * 2,
          height: textHeight + paddingY * 2,
          fill: accent,
          rx: (textHeight + paddingY * 2) / 2,
          ry: (textHeight + paddingY * 2) / 2,
          originX: 'center',
          originY: 'center',
        });
        const group = new Group([pill, text], {
          left,
          top,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.renderAll();
        const id = addLayer({ type: 'cta', name: 'CTA', fabricObject: group });
        selectLayer(id);
        return;
      }

      const copy = kind === 'headline' ? headline : subhead;
      if (!copy) return;

      const obj = new IText(copy, {
        fontSize,
        fontWeight: kind === 'headline' ? 'bold' : 'normal',
        fill: contrast.fill,
        fontFamily: 'Space Grotesk, Inter, system-ui, sans-serif',
        textAlign: 'center',
        left,
        top,
        originX: 'center',
        originY: 'center',
        shadow: contrast.needsShadow
          ? new Shadow({
              color:
                contrast.fill === '#ffffff'
                  ? 'rgba(0,0,0,0.55)'
                  : 'rgba(255,255,255,0.55)',
              offsetX: 0,
              offsetY: 2,
              blur: 12,
            })
          : null,
      });
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.renderAll();
      const id = addLayer({
        type: 'text',
        name: kind === 'headline' ? 'Headline' : 'Subhead',
        fabricObject: obj,
      });
      selectLayer(id);
    },
    [accent, addLayer, canvas, ctaText, headline, selectLayer, subhead],
  );

  if (!lastAdSpec) {
    return (
      <div className="p-3 text-[11px] text-zinc-500" data-testid="copy-suggestions-empty">
        Generate an ad to see AI-written copy you can insert onto the canvas.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2" data-testid="copy-suggestions">
      <span className="panel-label mb-0">Copy suggestions</span>
      <CopyChip
        label="Headline"
        text={headline}
        onInsert={() => insertText('headline')}
        disabled={!canvas || !headline}
      />
      <CopyChip
        label="Subhead"
        text={subhead}
        onInsert={() => insertText('subhead')}
        disabled={!canvas || !subhead}
      />
      <CopyChip
        label="CTA"
        text={ctaText}
        onInsert={() => insertText('cta')}
        disabled={!canvas || !ctaText}
      />
    </div>
  );
}

interface CopyChipProps {
  label: string;
  text: string;
  onInsert: () => void;
  disabled: boolean;
}

function CopyChip({ label, text, onInsert, disabled }: CopyChipProps) {
  return (
    <button
      type="button"
      onClick={onInsert}
      disabled={disabled}
      data-testid={`copy-chip-${label.toLowerCase()}`}
      className="copy-chip text-left w-full rounded-md border border-zinc-700/60 bg-zinc-900/40 hover:bg-zinc-800/70 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-2 transition"
    >
      <span className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">
        {label}
      </span>
      <span className="block text-[12px] text-zinc-100 leading-snug line-clamp-3">
        {text || '—'}
      </span>
    </button>
  );
}

// Pick readable foreground (white or near-black) for text drawn on top of
// the given hex. Used for CTA pill contents where the "background" is the
// button color, not the image beneath.
function pickReadableOn(hex: string): string {
  const parsed = hex.replace('#', '');
  if (parsed.length !== 3 && parsed.length !== 6) return '#ffffff';
  const expanded =
    parsed.length === 3
      ? parsed
          .split('')
          .map((c) => c + c)
          .join('')
      : parsed;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return '#ffffff';
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 150 ? '#111111' : '#ffffff';
}
