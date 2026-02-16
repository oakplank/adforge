import { useCallback } from 'react';
import { Canvas, FabricImage, Textbox, Rect } from 'fabric';
import type { GenerationResult } from './useGeneration';
import { getTemplateById, mapTemplateToFormat, type MappedSlot } from '../types/templates';
import { useLayerStore } from '../store/layerStore';
import type { TextStyle } from '../types/layers';
import type { PlacementPlan, PlacementTextBlock, PlacementCtaBlock } from '../utils/imagePlacementAnalyzer';

export interface ComposeOptions {
  canvas: Canvas | null;
  formatId: string;
  canvasWidth: number;
  canvasHeight: number;
}

interface TextTreatmentProfile {
  id: string;
  headlineFont: string;
  subheadFont: string;
  ctaFont: string;
  uppercaseHeadline: boolean;
  headlineTight: boolean;
  subheadItalic: boolean;
  scrimMode: 'none' | 'minimal' | 'soft' | 'solid';
  scrimRadius: number;
  scrimOpacityScale: number;
  ctaMode: 'pill' | 'outline' | 'ghost' | 'label';
  ctaRadius: number;
  ctaFillAlpha: number;
  ctaStrokeAlpha: number;
  ctaUppercase: boolean;
  ctaPrefix?: string;
}

const TEXT_TREATMENTS: TextTreatmentProfile[] = [
  {
    id: 'editorial-soft',
    headlineFont: 'Space Grotesk',
    subheadFont: 'Manrope',
    ctaFont: 'Space Grotesk',
    uppercaseHeadline: false,
    headlineTight: true,
    subheadItalic: false,
    scrimMode: 'minimal',
    scrimRadius: 18,
    scrimOpacityScale: 0.82,
    ctaMode: 'label',
    ctaRadius: 22,
    ctaFillAlpha: 0.52,
    ctaStrokeAlpha: 0,
    ctaUppercase: false,
  },
  {
    id: 'quiet-minimal',
    headlineFont: 'Manrope',
    subheadFont: 'Manrope',
    ctaFont: 'Manrope',
    uppercaseHeadline: false,
    headlineTight: false,
    subheadItalic: false,
    scrimMode: 'none',
    scrimRadius: 8,
    scrimOpacityScale: 0.72,
    ctaMode: 'ghost',
    ctaRadius: 10,
    ctaFillAlpha: 0,
    ctaStrokeAlpha: 0,
    ctaUppercase: false,
    ctaPrefix: '→',
  },
  {
    id: 'serif-story',
    headlineFont: 'DM Serif Display',
    subheadFont: 'Manrope',
    ctaFont: 'Space Grotesk',
    uppercaseHeadline: false,
    headlineTight: false,
    subheadItalic: true,
    scrimMode: 'minimal',
    scrimRadius: 22,
    scrimOpacityScale: 0.9,
    ctaMode: 'ghost',
    ctaRadius: 8,
    ctaFillAlpha: 0.62,
    ctaStrokeAlpha: 0,
    ctaUppercase: false,
  },
  {
    id: 'campaign-outline',
    headlineFont: 'Space Grotesk',
    subheadFont: 'Manrope',
    ctaFont: 'Space Grotesk',
    uppercaseHeadline: true,
    headlineTight: true,
    subheadItalic: false,
    scrimMode: 'minimal',
    scrimRadius: 12,
    scrimOpacityScale: 1.1,
    ctaMode: 'outline',
    ctaRadius: 16,
    ctaFillAlpha: 0.1,
    ctaStrokeAlpha: 0.8,
    ctaUppercase: true,
  },
  {
    id: 'warm-label',
    headlineFont: 'Playfair Display',
    subheadFont: 'Manrope',
    ctaFont: 'Space Grotesk',
    uppercaseHeadline: false,
    headlineTight: false,
    subheadItalic: false,
    scrimMode: 'minimal',
    scrimRadius: 28,
    scrimOpacityScale: 0.86,
    ctaMode: 'ghost',
    ctaRadius: 14,
    ctaFillAlpha: 0.68,
    ctaStrokeAlpha: 0,
    ctaUppercase: false,
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function resolveTextTreatment(result: GenerationResult): TextTreatmentProfile {
  const objective = result.adSpec.metadata?.objective || 'awareness';
  const variantIndex = result.adSpec.metadata?.copyVariantIndex ?? 0;
  const hintedId = result.adSpec.metadata?.textTreatmentHintId;
  if (hintedId) {
    const hinted = TEXT_TREATMENTS.find((candidate) => candidate.id === hintedId);
    if (hinted) return hinted;
  }
  const key = [
    result.adSpec.texts.headline,
    result.adSpec.texts.subhead,
    result.adSpec.texts.cta,
    objective,
    String(variantIndex),
  ].join('|');
  const index = hashString(key) % TEXT_TREATMENTS.length;
  const objectiveProfiles =
    objective === 'offer'
      ? ['campaign-outline', 'editorial-soft', 'warm-label']
      : ['quiet-minimal', 'serif-story', 'warm-label', 'editorial-soft'];
  const objectiveFiltered = TEXT_TREATMENTS.filter((profile) =>
    objectiveProfiles.includes(profile.id)
  );
  if (objectiveFiltered.length > 0) {
    return objectiveFiltered[index % objectiveFiltered.length];
  }

  return TEXT_TREATMENTS[index];
}

function buildTextStyle(slot: MappedSlot, textColor: string): TextStyle {
  return {
    fontFamily: slot.style.fontFamily || 'Space Grotesk',
    fontSize: slot.style.fontSize || 48,
    fill: slot.style.color || textColor,
    fontWeight:
      slot.style.fontWeight === '700' ||
      slot.style.fontWeight === '900' ||
      slot.style.fontWeight === 'bold'
        ? 'bold'
        : 'normal',
    fontStyle: 'normal',
    underline: false,
    textAlign: (slot.style.textAlign as TextStyle['textAlign']) || 'left',
    shadow: null,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) {
    return `rgba(0, 0, 0, ${clamp(alpha, 0, 1)})`;
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[a-fA-F0-9]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function luminanceFromRgb(r: number, g: number, b: number): number {
  const linear = [r, g, b].map((component) => {
    const s = component / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function bestTextColorForBackground(backgroundHex: string): '#F8F8F4' | '#141414' {
  const parsed = parseHexColor(backgroundHex);
  if (!parsed) return '#F8F8F4';

  const bgLum = luminanceFromRgb(parsed.r, parsed.g, parsed.b);
  const whiteContrast = contrastRatio(1, bgLum);
  const blackContrast = contrastRatio(0, bgLum);

  return whiteContrast >= blackContrast ? '#F8F8F4' : '#141414';
}

function resolveBlockTextColor(
  block: PlacementTextBlock | PlacementCtaBlock,
  desiredColor: string
): string {
  if (!block.scrim.enabled || block.scrim.opacity < 0.15) {
    return desiredColor;
  }

  return bestTextColorForBackground(block.scrim.color);
}

function toPixels(
  block: PlacementTextBlock | PlacementCtaBlock,
  canvasWidth: number,
  canvasHeight: number
) {
  return {
    left: block.x * canvasWidth,
    top: block.y * canvasHeight,
    width: block.width * canvasWidth,
    height: block.height * canvasHeight,
  };
}

function estimateTextboxWidth(
  text: string,
  fontSize: number,
  laneWidth: number,
  role: 'headline' | 'subhead' | 'cta'
): number {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const charsPerLine = role === 'headline' ? 16 : role === 'subhead' ? 26 : 18;
  const avgCharWidth = role === 'headline' ? 0.56 : role === 'subhead' ? 0.5 : 0.58;
  const estimated = (normalized.length / charsPerLine) * fontSize * charsPerLine * avgCharWidth;
  const minWidth = laneWidth * (role === 'headline' ? 0.58 : role === 'subhead' ? 0.52 : 0.34);
  const maxWidth = laneWidth * (role === 'cta' ? 0.92 : 1);
  return clamp(estimated, minWidth, maxWidth);
}

function positionByAlignment(
  laneLeft: number,
  laneWidth: number,
  contentWidth: number,
  align: 'left' | 'center' | 'right'
): number {
  if (align === 'center') return laneLeft + (laneWidth - contentWidth) / 2;
  if (align === 'right') return laneLeft + laneWidth - contentWidth;
  return laneLeft;
}

function refreshTextboxMetrics(textbox: Textbox): void {
  const target = textbox as Textbox & { initDimensions?: () => void; setCoords: () => void };
  target.initDimensions?.();
  target.setCoords();
}

function fitTextboxToHeight(
  textbox: Textbox,
  maxHeightPx: number,
  minFontSize: number,
  fontStep = 2
): void {
  const startSize = typeof textbox.fontSize === 'number' ? textbox.fontSize : 24;
  let size = startSize;
  refreshTextboxMetrics(textbox);

  while ((textbox.height || 0) > maxHeightPx && size > minFontSize) {
    size = Math.max(minFontSize, size - fontStep);
    textbox.set({ fontSize: size });
    refreshTextboxMetrics(textbox);
  }
}

function trimTextToHeight(textbox: Textbox, originalText: string, maxHeightPx: number): void {
  if ((textbox.height || 0) <= maxHeightPx) return;

  const words = originalText.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 3) return;

  let low = 1;
  let high = words.length;
  let best = words[0];

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = words.slice(0, mid).join(' ');
    textbox.set({ text: candidate });
    refreshTextboxMetrics(textbox);

    if ((textbox.height || 0) <= maxHeightPx) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  textbox.set({ text: best });
  refreshTextboxMetrics(textbox);
}

function placeCoverImage(
  img: FabricImage,
  canvasWidth: number,
  canvasHeight: number,
  preferredAlignment: 'left' | 'center' | 'right' | 'auto' = 'auto'
) {
  const sourceWidth = img.width || canvasWidth;
  const sourceHeight = img.height || canvasHeight;
  const scale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight) * 1.03;
  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;
  const overflowX = Math.max(0, scaledWidth - canvasWidth);
  const overflowY = Math.max(0, scaledHeight - canvasHeight);

  let focalX = 0.5;
  if (preferredAlignment === 'left') {
    // Keep more right-side visual area when text is left-aligned.
    focalX = 0.62;
  } else if (preferredAlignment === 'right') {
    focalX = 0.38;
  }

  const left = -overflowX * focalX;
  const top = -overflowY * 0.5;

  img.set({
    left,
    top,
    scaleX: scale,
    scaleY: scale,
    selectable: false,
    evented: false,
  });
}

function addScrimIfNeeded(
  canvas: Canvas,
  addLayer: ReturnType<typeof useLayerStore.getState>['addLayer'],
  label: string,
  block: PlacementTextBlock | PlacementCtaBlock,
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    mode?: TextTreatmentProfile['scrimMode'];
    radius?: number;
    opacityScale?: number;
  }
) {
  const mode = options?.mode || 'soft';
  if (mode === 'none') return null;
  if (!block.scrim.enabled && mode === 'minimal') return null;
  if (!block.scrim.enabled && mode === 'soft') return null;

  const blockPx = toPixels(block, canvasWidth, canvasHeight);
  const padX = block.scrim.padding * canvasWidth;
  const padY = block.scrim.padding * canvasHeight;
  const opacityScale = options?.opacityScale ?? 1;
  const baseOpacity = clamp(block.scrim.opacity * opacityScale, 0.12, 0.75);
  const fillOpacity =
    mode === 'minimal'
      ? clamp(baseOpacity * 0.72, 0.1, 0.4)
      : mode === 'solid'
        ? clamp(baseOpacity * 1.2, 0.28, 0.82)
        : baseOpacity;
  const radius = options?.radius ?? 14;

  const scrim = new Rect({
    left: blockPx.left - padX,
    top: blockPx.top - padY,
    width: blockPx.width + padX * 2,
    height: blockPx.height + padY * 2,
    fill: hexToRgba(block.scrim.color, fillOpacity),
    rx: radius,
    ry: radius,
    selectable: false,
    evented: false,
  });

  canvas.add(scrim);
  addLayer({ type: 'shape', name: `${label} Scrim`, fabricObject: scrim });
  return { scrim, padX, padY };
}

function getScaledBounds(textbox: Textbox): { left: number; top: number; width: number; height: number } {
  const scaledWidth =
    typeof textbox.getScaledWidth === 'function'
      ? textbox.getScaledWidth()
      : (textbox.width || 0) * (textbox.scaleX || 1);
  const scaledHeight =
    typeof textbox.getScaledHeight === 'function'
      ? textbox.getScaledHeight()
      : (textbox.height || 0) * (textbox.scaleY || 1);

  return {
    left: textbox.left || 0,
    top: textbox.top || 0,
    width: scaledWidth,
    height: scaledHeight,
  };
}

function measureTextboxContentWidth(textbox: Textbox): number {
  const target = textbox as Textbox & {
    getLineWidth?: (lineIndex: number) => number;
    _textLines?: unknown[];
  };
  if (typeof target.getLineWidth === 'function' && Array.isArray(target._textLines)) {
    let max = 0;
    for (let i = 0; i < target._textLines.length; i += 1) {
      max = Math.max(max, target.getLineWidth(i));
    }
    return max * (textbox.scaleX || 1);
  }

  return (textbox.width || 0) * (textbox.scaleX || 1);
}

function linkBackdropToTextbox(
  canvas: Canvas,
  textbox: Textbox,
  backdrop: Rect,
  padX: number,
  padY: number,
  minHeight = 0,
  options?: {
    fitToText?: boolean;
    minWidth?: number;
    maxWidth?: number;
  }
) {
  const syncBackdrop = () => {
    refreshTextboxMetrics(textbox);
    const bounds = getScaledBounds(textbox);
    const align = (textbox.textAlign || 'left') as 'left' | 'center' | 'right';
    const contentWidth = measureTextboxContentWidth(textbox);
    const fitToText = options?.fitToText ?? false;
    const maxWidth = options?.maxWidth ?? bounds.width + padX * 2;
    const minWidth = options?.minWidth ?? Math.min(bounds.width, 80);
    const desiredWidth = fitToText
      ? clamp(contentWidth + padX * 2, minWidth, maxWidth)
      : bounds.width + padX * 2;
    const textBoxContentLeft = positionByAlignment(
      bounds.left,
      bounds.width,
      Math.min(contentWidth, bounds.width),
      align
    );
    const left = fitToText
      ? positionByAlignment(
          textBoxContentLeft - padX,
          Math.min(contentWidth + padX * 2, bounds.width + padX * 2),
          desiredWidth,
          align
        )
      : bounds.left - padX;

    backdrop.set({
      left,
      top: bounds.top - padY,
      width: desiredWidth,
      height: Math.max(bounds.height + padY * 2, minHeight),
    });
    backdrop.setCoords();
    canvas.requestRenderAll();
  };

  textbox.on('moving', syncBackdrop);
  textbox.on('scaling', syncBackdrop);
  textbox.on('modified', syncBackdrop);
  textbox.on('changed', syncBackdrop);
  syncBackdrop();
}

function resolveTemplateTextStyle(
  slots: MappedSlot[],
  type: 'headline' | 'subhead',
  fallbackColor: string
): TextStyle {
  const slot = slots.find((candidate) => candidate.type === type);
  if (!slot) {
    return {
      fontFamily: 'Space Grotesk',
      fontSize: type === 'headline' ? 62 : 28,
      fill: fallbackColor,
      fontWeight: type === 'headline' ? 'bold' : 'normal',
      fontStyle: 'normal',
      underline: false,
      textAlign: 'left',
      shadow: null,
    };
  }

  return buildTextStyle(slot, fallbackColor);
}

export function useAdComposition({ canvas, formatId, canvasWidth, canvasHeight }: ComposeOptions) {
  const addLayer = useLayerStore((s) => s.addLayer);
  const setLayers = useLayerStore((s) => s.setLayers);

  const compose = useCallback(async (result: GenerationResult) => {
    if (!canvas) return;

    canvas.clear();
    setLayers([]);

    const { adSpec, imageUrl, imageBase64 } = result;
    const template = getTemplateById(adSpec.templateId) || getTemplateById('bold-sale');
    if (!template) return;

    const slots = mapTemplateToFormat(template, formatId);
    const textColor = adSpec.colors.text || '#FFFFFF';
    const placementPlan: PlacementPlan | undefined = adSpec.metadata?.placementPlan;
    const preferredAlignment =
      adSpec.metadata?.placementHints?.preferredAlignment || 'auto';
    const textTreatment = resolveTextTreatment(result);

    const bgSlot = slots.find((s) => s.type === 'background');
    if (bgSlot) {
      const imgSrc = imageBase64 ? `data:image/png;base64,${imageBase64}` : imageUrl || '';

      if (imgSrc) {
        try {
          const img = await FabricImage.fromURL(imgSrc);
          placeCoverImage(img, canvasWidth, canvasHeight, preferredAlignment);
          canvas.add(img);
          addLayer({ type: 'background', name: 'Background Image', fabricObject: img });
        } catch {
          const bgRect = new Rect({
            left: 0,
            top: 0,
            width: canvasWidth,
            height: canvasHeight,
            fill: adSpec.colors.background || '#1a1a2e',
            selectable: false,
            evented: false,
          });
          canvas.add(bgRect);
          addLayer({ type: 'background', name: 'Background', fabricObject: bgRect });
        }
      }
    }

    if (placementPlan) {
      const headlineBaseStyle = resolveTemplateTextStyle(slots, 'headline', textColor);
      const subheadBaseStyle = resolveTemplateTextStyle(slots, 'subhead', textColor);
      const ctaPx = toPixels(placementPlan.cta, canvasWidth, canvasHeight);
      const laneGap = canvasHeight * 0.02;

      const headlineScrim = addScrimIfNeeded(
        canvas,
        addLayer,
        'Headline',
        placementPlan.headline,
        canvasWidth,
        canvasHeight,
        {
          mode: textTreatment.scrimMode,
          radius: textTreatment.scrimRadius,
          opacityScale: textTreatment.scrimOpacityScale,
        }
      );
      const headlinePx = toPixels(placementPlan.headline, canvasWidth, canvasHeight);
      const headlineSize = clamp(Math.round(headlinePx.height * 0.58), 34, formatId === 'story' ? 112 : 88);
      const headlineText = textTreatment.uppercaseHeadline
        ? adSpec.texts.headline.toUpperCase()
        : adSpec.texts.headline;
      const headlineWidth = estimateTextboxWidth(
        headlineText,
        headlineSize,
        headlinePx.width,
        'headline'
      );
      const headlineLeft = positionByAlignment(
        headlinePx.left,
        headlinePx.width,
        headlineWidth,
        placementPlan.headline.align
      );
      const headlineTextbox = new Textbox(headlineText, {
        left: headlineLeft,
        top: headlinePx.top,
        width: headlineWidth,
        fontSize: headlineSize,
        fontFamily: textTreatment.headlineFont,
        fontWeight: textTreatment.headlineFont === 'DM Serif Display' || textTreatment.headlineFont === 'Playfair Display'
          ? '700'
          : '800',
        fill: resolveBlockTextColor(
          placementPlan.headline,
          placementPlan.headline.color || headlineBaseStyle.fill
        ),
        textAlign: placementPlan.headline.align,
        lineHeight: textTreatment.headlineTight ? 1.02 : 1.1,
      });
      fitTextboxToHeight(headlineTextbox, headlinePx.height, 26, 2);
      trimTextToHeight(headlineTextbox, headlineText, headlinePx.height);
      canvas.add(headlineTextbox);
      if (headlineScrim) {
        linkBackdropToTextbox(
          canvas,
          headlineTextbox,
          headlineScrim.scrim,
          headlineScrim.padX,
          headlineScrim.padY,
          0,
          {
            fitToText: true,
            minWidth: headlinePx.width * 0.44,
            maxWidth: headlinePx.width + headlineScrim.padX * 2,
          }
        );
      }
      const headlineLayerId = addLayer({ type: 'text', name: 'Headline', fabricObject: headlineTextbox });
      useLayerStore.getState().updateTextStyle(headlineLayerId, {
        ...headlineBaseStyle,
        fontFamily: textTreatment.headlineFont,
        fontSize: headlineTextbox.fontSize || headlineSize,
        fill: resolveBlockTextColor(
          placementPlan.headline,
          placementPlan.headline.color || headlineBaseStyle.fill
        ),
        textAlign: placementPlan.headline.align,
        fontWeight: 'bold',
      });

      const subheadScrim = addScrimIfNeeded(
        canvas,
        addLayer,
        'Subhead',
        placementPlan.subhead,
        canvasWidth,
        canvasHeight,
        {
          mode: textTreatment.scrimMode === 'solid' ? 'minimal' : textTreatment.scrimMode,
          radius: Math.max(6, textTreatment.scrimRadius - 4),
          opacityScale: textTreatment.scrimOpacityScale * 0.92,
        }
      );
      const subheadPx = toPixels(placementPlan.subhead, canvasWidth, canvasHeight);
      const subheadSize = clamp(
        Math.round((headlineTextbox.fontSize || headlineSize) * 0.52),
        17,
        formatId === 'story' ? 56 : 44
      );
      const headlineBottom = (headlineTextbox.top || headlinePx.top) + (headlineTextbox.height || headlinePx.height);
      const minSubheadTop = headlineBottom + laneGap;
      const subheadTop = Math.max(subheadPx.top, minSubheadTop);
      const maxSubheadHeight = Math.max(40, Math.min(subheadPx.height, ctaPx.top - subheadTop - laneGap));
      const subheadWidth = estimateTextboxWidth(
        adSpec.texts.subhead,
        subheadSize,
        subheadPx.width,
        'subhead'
      );
      const subheadLeft = positionByAlignment(
        subheadPx.left,
        subheadPx.width,
        subheadWidth,
        placementPlan.subhead.align
      );
      const subheadTextbox = new Textbox(adSpec.texts.subhead, {
        left: subheadLeft,
        top: subheadTop,
        width: subheadWidth,
        fontSize: subheadSize,
        fontFamily: textTreatment.subheadFont,
        fontWeight: textTreatment.subheadFont === 'Manrope' ? '500' : '400',
        fontStyle: textTreatment.subheadItalic ? 'italic' : 'normal',
        fill: resolveBlockTextColor(
          placementPlan.subhead,
          placementPlan.subhead.color || subheadBaseStyle.fill
        ),
        textAlign: placementPlan.subhead.align,
        lineHeight: textTreatment.subheadItalic ? 1.28 : 1.18,
      });
      fitTextboxToHeight(subheadTextbox, maxSubheadHeight, 14, 1);
      trimTextToHeight(subheadTextbox, adSpec.texts.subhead, maxSubheadHeight);
      canvas.add(subheadTextbox);
      if (subheadScrim) {
        linkBackdropToTextbox(
          canvas,
          subheadTextbox,
          subheadScrim.scrim,
          subheadScrim.padX,
          subheadScrim.padY,
          0,
          {
            fitToText: true,
            minWidth: subheadPx.width * 0.4,
            maxWidth: subheadPx.width + subheadScrim.padX * 2,
          }
        );
      }
      const subheadLayerId = addLayer({ type: 'text', name: 'Subhead', fabricObject: subheadTextbox });
      useLayerStore.getState().updateTextStyle(subheadLayerId, {
        ...subheadBaseStyle,
        fontFamily: textTreatment.subheadFont,
        fontStyle: textTreatment.subheadItalic ? 'italic' : 'normal',
        fontSize: subheadTextbox.fontSize || subheadSize,
        fill: resolveBlockTextColor(
          placementPlan.subhead,
          placementPlan.subhead.color || subheadBaseStyle.fill
        ),
        textAlign: placementPlan.subhead.align,
        fontWeight: 'normal',
      });

      addScrimIfNeeded(canvas, addLayer, 'CTA', placementPlan.cta, canvasWidth, canvasHeight, {
        mode: textTreatment.scrimMode === 'none' ? 'none' : 'minimal',
        radius: Math.max(6, textTreatment.scrimRadius - 6),
        opacityScale: textTreatment.scrimOpacityScale * 0.86,
      });
      const ctaTextSize = clamp(Math.round(headlineSize * 0.34), 14, 30);
      const subheadBottom = (subheadTextbox.top || subheadTop) + (subheadTextbox.height || maxSubheadHeight);
      const minCtaTop = subheadBottom + laneGap;
      const ctaTop = Math.max(ctaPx.top, minCtaTop);
      const ctaLabelBase = textTreatment.ctaPrefix
        ? `${textTreatment.ctaPrefix} ${adSpec.texts.cta}`
        : adSpec.texts.cta;
      const ctaLabel = textTreatment.ctaUppercase
        ? ctaLabelBase.toUpperCase()
        : ctaLabelBase;
      const ctaWidth = estimateTextboxWidth(ctaLabel, ctaTextSize, ctaPx.width, 'cta');
      const ctaLeft = positionByAlignment(
        ctaPx.left,
        ctaPx.width,
        ctaWidth,
        placementPlan.cta.align || 'center'
      );
      const ctaPadX = canvasWidth * (textTreatment.ctaMode === 'label' ? 0.008 : 0.012);
      const ctaPadY = canvasHeight * (textTreatment.ctaMode === 'label' ? 0.004 : 0.007);

      let ctaStrip: Rect | null = null;
      if (textTreatment.ctaMode !== 'ghost') {
        const ctaRectConfig: ConstructorParameters<typeof Rect>[0] = {
          left: ctaLeft - ctaPadX,
          top: ctaTop - ctaPadY,
          width: ctaWidth + ctaPadX * 2,
          height: ctaPx.height + ctaPadY * 2,
          rx: textTreatment.ctaRadius,
          ry: textTreatment.ctaRadius,
          selectable: false,
          evented: false,
          strokeWidth: 0,
        };

        if (textTreatment.ctaMode === 'outline') {
          ctaRectConfig.fill = hexToRgba(adSpec.colors.background || '#132B20', textTreatment.ctaFillAlpha);
          ctaRectConfig.stroke = hexToRgba(adSpec.colors.secondary || '#F1E9DA', textTreatment.ctaStrokeAlpha);
          ctaRectConfig.strokeWidth = 2;
        } else if (textTreatment.ctaMode === 'label') {
          ctaRectConfig.fill = hexToRgba(adSpec.colors.background || '#132B20', textTreatment.ctaFillAlpha);
          ctaRectConfig.rx = Math.max(6, textTreatment.ctaRadius - 4);
          ctaRectConfig.ry = Math.max(6, textTreatment.ctaRadius - 4);
        } else {
          ctaRectConfig.fill = hexToRgba(adSpec.colors.background || '#132B20', textTreatment.ctaFillAlpha);
        }

        ctaStrip = new Rect(ctaRectConfig);
        canvas.add(ctaStrip);
        addLayer({ type: 'shape', name: 'CTA Strip', fabricObject: ctaStrip });
      }

      const ctaText = new Textbox(ctaLabel, {
        left: ctaLeft,
        top: ctaTop,
        width: ctaWidth,
        fontSize: ctaTextSize,
        fontFamily: textTreatment.ctaFont,
        fontWeight: textTreatment.ctaMode === 'ghost' ? '600' : '700',
        fill: resolveBlockTextColor(
          placementPlan.cta,
          placementPlan.cta.textColor || placementPlan.cta.color || headlineBaseStyle.fill
        ),
        textAlign: placementPlan.cta.align || 'center',
        lineHeight: 1.06,
      });

      canvas.add(ctaText);
      if (ctaStrip) {
        linkBackdropToTextbox(
          canvas,
          ctaText,
          ctaStrip,
          ctaPadX,
          ctaPadY,
          ctaPx.height + ctaPadY * 2,
          {
            fitToText: true,
            minWidth: ctaWidth + ctaPadX * 2,
            maxWidth: ctaPx.width + ctaPadX * 2,
          }
        );
      }
      const ctaLayerId = addLayer({ type: 'text', name: 'CTA', fabricObject: ctaText });
      useLayerStore.getState().updateTextStyle(ctaLayerId, {
        ...headlineBaseStyle,
        fontFamily: textTreatment.ctaFont,
        fontSize: ctaTextSize,
        fill: resolveBlockTextColor(
          placementPlan.cta,
          placementPlan.cta.textColor || placementPlan.cta.color || headlineBaseStyle.fill
        ),
        textAlign: placementPlan.cta.align || 'center',
        fontWeight: 'bold',
      });

      canvas.renderAll();
      return;
    }

    const headlineSlot = slots.find((s) => s.type === 'headline');
    if (headlineSlot) {
      const headlineText = textTreatment.uppercaseHeadline
        ? adSpec.texts.headline.toUpperCase()
        : adSpec.texts.headline;
      const textbox = new Textbox(headlineText, {
        left: headlineSlot.position.x,
        top: headlineSlot.position.y,
        width: headlineSlot.position.width,
        fontSize: headlineSlot.style.fontSize || 72,
        fontFamily: textTreatment.headlineFont,
        fontWeight: headlineSlot.style.fontWeight || '900',
        fill: headlineSlot.style.color || textColor,
        textAlign: headlineSlot.style.textAlign || 'center',
      });
      canvas.add(textbox);
      const textStyle = buildTextStyle(headlineSlot, textColor);
      const layerId = addLayer({ type: 'text', name: 'Headline', fabricObject: textbox });
      useLayerStore.getState().updateTextStyle(layerId, {
        ...textStyle,
        fontFamily: textTreatment.headlineFont,
      });
    }

    const subheadSlot = slots.find((s) => s.type === 'subhead');
    if (subheadSlot) {
      const textbox = new Textbox(adSpec.texts.subhead, {
        left: subheadSlot.position.x,
        top: subheadSlot.position.y,
        width: subheadSlot.position.width,
        fontSize: subheadSlot.style.fontSize || 28,
        fontFamily: textTreatment.subheadFont,
        fontWeight: subheadSlot.style.fontWeight || '400',
        fontStyle: textTreatment.subheadItalic ? 'italic' : 'normal',
        fill: subheadSlot.style.color || textColor,
        textAlign: subheadSlot.style.textAlign || 'center',
      });
      canvas.add(textbox);
      const textStyle = buildTextStyle(subheadSlot, textColor);
      const layerId = addLayer({ type: 'text', name: 'Subhead', fabricObject: textbox });
      useLayerStore.getState().updateTextStyle(layerId, {
        ...textStyle,
        fontFamily: textTreatment.subheadFont,
        fontStyle: textTreatment.subheadItalic ? 'italic' : 'normal',
      });
    }

    const ctaSlot = slots.find((s) => s.type === 'cta');
    if (ctaSlot) {
      const ctaLabelBase = textTreatment.ctaPrefix
        ? `${textTreatment.ctaPrefix} ${adSpec.texts.cta}`
        : adSpec.texts.cta;
      const ctaLabel = textTreatment.ctaUppercase ? ctaLabelBase.toUpperCase() : ctaLabelBase;
      const ctaText = new Textbox(ctaLabel, {
        left: ctaSlot.position.x,
        top: ctaSlot.position.y,
        width: ctaSlot.position.width,
        fontSize: ctaSlot.style.fontSize || 24,
        fontFamily: textTreatment.ctaFont,
        fontWeight: ctaSlot.style.fontWeight || '700',
        fill: ctaSlot.style.color || adSpec.colors.text || '#FFFFFF',
        textAlign: ctaSlot.style.textAlign || 'center',
        lineHeight: 1.08,
      });
      canvas.add(ctaText);
      const ctaLayerId = addLayer({ type: 'text', name: 'CTA', fabricObject: ctaText });
      useLayerStore.getState().updateTextStyle(ctaLayerId, {
        fontFamily: textTreatment.ctaFont,
        fontSize: ctaSlot.style.fontSize || 24,
        fill: ctaSlot.style.color || adSpec.colors.text || '#FFFFFF',
        fontWeight:
          ctaSlot.style.fontWeight === '700' ||
          ctaSlot.style.fontWeight === '900' ||
          ctaSlot.style.fontWeight === 'bold'
            ? 'bold'
            : 'normal',
        fontStyle: 'normal',
        underline: false,
        textAlign: (ctaSlot.style.textAlign as TextStyle['textAlign']) || 'center',
        shadow: null,
      });
    }

    canvas.renderAll();
  }, [canvas, formatId, canvasWidth, canvasHeight, addLayer, setLayers]);

  return { compose };
}
