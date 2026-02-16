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
  canvasHeight: number
) {
  if (!block.scrim.enabled) return null;

  const blockPx = toPixels(block, canvasWidth, canvasHeight);
  const padX = block.scrim.padding * canvasWidth;
  const padY = block.scrim.padding * canvasHeight;

  const scrim = new Rect({
    left: blockPx.left - padX,
    top: blockPx.top - padY,
    width: blockPx.width + padX * 2,
    height: blockPx.height + padY * 2,
    fill: hexToRgba(block.scrim.color, block.scrim.opacity),
    rx: 14,
    ry: 14,
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

function linkBackdropToTextbox(
  canvas: Canvas,
  textbox: Textbox,
  backdrop: Rect,
  padX: number,
  padY: number,
  minHeight = 0
) {
  const syncBackdrop = () => {
    refreshTextboxMetrics(textbox);
    const bounds = getScaledBounds(textbox);
    backdrop.set({
      left: bounds.left - padX,
      top: bounds.top - padY,
      width: bounds.width + padX * 2,
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
        canvasHeight
      );
      const headlinePx = toPixels(placementPlan.headline, canvasWidth, canvasHeight);
      const headlineSize = clamp(Math.round(headlinePx.height * 0.58), 34, formatId === 'story' ? 112 : 88);
      const headlineTextbox = new Textbox(adSpec.texts.headline, {
        left: headlinePx.left,
        top: headlinePx.top,
        width: headlinePx.width,
        fontSize: headlineSize,
        fontFamily: headlineBaseStyle.fontFamily,
        fontWeight: 'bold',
        fill: resolveBlockTextColor(
          placementPlan.headline,
          placementPlan.headline.color || headlineBaseStyle.fill
        ),
        textAlign: placementPlan.headline.align,
        lineHeight: 1.03,
      });
      fitTextboxToHeight(headlineTextbox, headlinePx.height, 26, 2);
      trimTextToHeight(headlineTextbox, adSpec.texts.headline, headlinePx.height);
      canvas.add(headlineTextbox);
      if (headlineScrim) {
        linkBackdropToTextbox(canvas, headlineTextbox, headlineScrim.scrim, headlineScrim.padX, headlineScrim.padY);
      }
      const headlineLayerId = addLayer({ type: 'text', name: 'Headline', fabricObject: headlineTextbox });
      useLayerStore.getState().updateTextStyle(headlineLayerId, {
        ...headlineBaseStyle,
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
        canvasHeight
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
      const subheadTextbox = new Textbox(adSpec.texts.subhead, {
        left: subheadPx.left,
        top: subheadTop,
        width: subheadPx.width,
        fontSize: subheadSize,
        fontFamily: subheadBaseStyle.fontFamily,
        fontWeight: 'normal',
        fill: resolveBlockTextColor(
          placementPlan.subhead,
          placementPlan.subhead.color || subheadBaseStyle.fill
        ),
        textAlign: placementPlan.subhead.align,
        lineHeight: 1.2,
      });
      fitTextboxToHeight(subheadTextbox, maxSubheadHeight, 14, 1);
      trimTextToHeight(subheadTextbox, adSpec.texts.subhead, maxSubheadHeight);
      canvas.add(subheadTextbox);
      if (subheadScrim) {
        linkBackdropToTextbox(canvas, subheadTextbox, subheadScrim.scrim, subheadScrim.padX, subheadScrim.padY);
      }
      const subheadLayerId = addLayer({ type: 'text', name: 'Subhead', fabricObject: subheadTextbox });
      useLayerStore.getState().updateTextStyle(subheadLayerId, {
        ...subheadBaseStyle,
        fontSize: subheadTextbox.fontSize || subheadSize,
        fill: resolveBlockTextColor(
          placementPlan.subhead,
          placementPlan.subhead.color || subheadBaseStyle.fill
        ),
        textAlign: placementPlan.subhead.align,
        fontWeight: 'normal',
      });

      addScrimIfNeeded(canvas, addLayer, 'CTA', placementPlan.cta, canvasWidth, canvasHeight);
      const ctaTextSize = clamp(Math.round(headlineSize * 0.34), 14, 30);
      const subheadBottom = (subheadTextbox.top || subheadTop) + (subheadTextbox.height || maxSubheadHeight);
      const minCtaTop = subheadBottom + laneGap;
      const ctaTop = Math.max(ctaPx.top, minCtaTop);
      const ctaStrip = new Rect({
        left: ctaPx.left - canvasWidth * 0.012,
        top: ctaTop - canvasHeight * 0.007,
        width: ctaPx.width + canvasWidth * 0.024,
        height: ctaPx.height + canvasHeight * 0.014,
        fill: hexToRgba(adSpec.colors.background || '#132B20', 0.74),
        rx: 20,
        ry: 20,
        selectable: false,
        evented: false,
      });
      canvas.add(ctaStrip);
      addLayer({ type: 'shape', name: 'CTA Strip', fabricObject: ctaStrip });

      const ctaText = new Textbox(adSpec.texts.cta, {
        left: ctaPx.left,
        top: ctaTop,
        width: ctaPx.width,
        fontSize: ctaTextSize,
        fontFamily: headlineBaseStyle.fontFamily,
        fontWeight: '700',
        fill: resolveBlockTextColor(
          placementPlan.cta,
          placementPlan.cta.textColor || placementPlan.cta.color || headlineBaseStyle.fill
        ),
        textAlign: placementPlan.cta.align || 'center',
        lineHeight: 1.08,
      });

      canvas.add(ctaText);
      linkBackdropToTextbox(
        canvas,
        ctaText,
        ctaStrip,
        canvasWidth * 0.012,
        canvasHeight * 0.007,
        ctaPx.height + canvasHeight * 0.014
      );
      const ctaLayerId = addLayer({ type: 'text', name: 'CTA', fabricObject: ctaText });
      useLayerStore.getState().updateTextStyle(ctaLayerId, {
        ...headlineBaseStyle,
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
      const textbox = new Textbox(adSpec.texts.headline, {
        left: headlineSlot.position.x,
        top: headlineSlot.position.y,
        width: headlineSlot.position.width,
        fontSize: headlineSlot.style.fontSize || 72,
        fontFamily: headlineSlot.style.fontFamily || 'Space Grotesk',
        fontWeight: headlineSlot.style.fontWeight || '900',
        fill: headlineSlot.style.color || textColor,
        textAlign: headlineSlot.style.textAlign || 'center',
      });
      canvas.add(textbox);
      const textStyle = buildTextStyle(headlineSlot, textColor);
      const layerId = addLayer({ type: 'text', name: 'Headline', fabricObject: textbox });
      useLayerStore.getState().updateTextStyle(layerId, textStyle);
    }

    const subheadSlot = slots.find((s) => s.type === 'subhead');
    if (subheadSlot) {
      const textbox = new Textbox(adSpec.texts.subhead, {
        left: subheadSlot.position.x,
        top: subheadSlot.position.y,
        width: subheadSlot.position.width,
        fontSize: subheadSlot.style.fontSize || 28,
        fontFamily: subheadSlot.style.fontFamily || 'Space Grotesk',
        fontWeight: subheadSlot.style.fontWeight || '400',
        fill: subheadSlot.style.color || textColor,
        textAlign: subheadSlot.style.textAlign || 'center',
      });
      canvas.add(textbox);
      const textStyle = buildTextStyle(subheadSlot, textColor);
      const layerId = addLayer({ type: 'text', name: 'Subhead', fabricObject: textbox });
      useLayerStore.getState().updateTextStyle(layerId, textStyle);
    }

    const ctaSlot = slots.find((s) => s.type === 'cta');
    if (ctaSlot) {
      const ctaText = new Textbox(adSpec.texts.cta, {
        left: ctaSlot.position.x,
        top: ctaSlot.position.y,
        width: ctaSlot.position.width,
        fontSize: ctaSlot.style.fontSize || 24,
        fontFamily: ctaSlot.style.fontFamily || 'Space Grotesk',
        fontWeight: ctaSlot.style.fontWeight || '700',
        fill: ctaSlot.style.color || adSpec.colors.text || '#FFFFFF',
        textAlign: ctaSlot.style.textAlign || 'center',
        lineHeight: 1.08,
      });
      canvas.add(ctaText);
      const ctaLayerId = addLayer({ type: 'text', name: 'CTA', fabricObject: ctaText });
      useLayerStore.getState().updateTextStyle(ctaLayerId, {
        fontFamily: ctaSlot.style.fontFamily || 'Space Grotesk',
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
