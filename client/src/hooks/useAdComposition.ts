import { useCallback } from 'react';
import { Canvas, FabricImage, Gradient, Shadow, Textbox, Rect } from 'fabric';
import type { GenerationResult } from './useGeneration';
import { getTemplateById, mapTemplateToFormat, type MappedSlot } from '../types/templates';
import { useLayerStore } from '../store/layerStore';
import type { TextStyle } from '../types/layers';
import type { PlacementPlan, PlacementOverlays, PlacementTextBlock, PlacementCtaBlock } from '../utils/imagePlacementAnalyzer';

interface ComposeOptions {
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
  let best = `${words[0]}...`;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = `${words.slice(0, mid).join(' ')}...`;
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

// Edge-to-edge linear gradients give a cleaner editorial feel than per-block
// grey pills. Top fades dark→transparent behind the headline; bottom fades
// transparent→dark behind the CTA so it stays legible without a full pill.
function addGradientOverlays(
  canvas: Canvas,
  addLayer: ReturnType<typeof useLayerStore.getState>['addLayer'],
  overlays: PlacementOverlays,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (overlays.top.enabled) {
    const topHeight = canvasHeight * overlays.top.heightRatio;
    const topRect = new Rect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: topHeight,
      selectable: false,
      evented: false,
    });
    topRect.set(
      'fill',
      new Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: { x1: 0, y1: 0, x2: 0, y2: topHeight },
        colorStops: [
          { offset: 0, color: `rgba(0, 0, 0, ${clamp(overlays.top.opacity, 0, 1)})` },
          { offset: 1, color: 'rgba(0, 0, 0, 0)' },
        ],
      })
    );
    canvas.add(topRect);
    addLayer({ type: 'shape', name: 'Top Overlay', fabricObject: topRect });
  }

  if (overlays.bottom.enabled) {
    const bottomHeight = canvasHeight * overlays.bottom.heightRatio;
    const bottomRect = new Rect({
      left: 0,
      top: canvasHeight - bottomHeight,
      width: canvasWidth,
      height: bottomHeight,
      selectable: false,
      evented: false,
    });
    bottomRect.set(
      'fill',
      new Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: { x1: 0, y1: 0, x2: 0, y2: bottomHeight },
        colorStops: [
          { offset: 0, color: 'rgba(0, 0, 0, 0)' },
          { offset: 1, color: `rgba(0, 0, 0, ${clamp(overlays.bottom.opacity, 0, 1)})` },
        ],
      })
    );
    canvas.add(bottomRect);
    addLayer({ type: 'shape', name: 'Bottom Overlay', fabricObject: bottomRect });
  }
}

function buildTextShadow(): Shadow {
  return new Shadow({
    color: 'rgba(0, 0, 0, 0.55)',
    blur: 14,
    offsetX: 0,
    offsetY: 2,
  });
}

// Plans persisted before the overlay/gradient refactor carry scrim.enabled=true
// and no overlays field. Normalize so loaded history renders in the new style.
function normalizePlacementPlan(plan: PlacementPlan): PlacementPlan {
  const disabledScrim: PlacementTextBlock['scrim'] = {
    enabled: false,
    color: '#000000',
    opacity: 0,
    padding: plan.headline.scrim.padding,
  };

  const overlays: PlacementOverlays = plan.overlays ?? {
    top: { enabled: true, opacity: 0.42, heightRatio: 0.38 },
    bottom: { enabled: true, opacity: 0.48, heightRatio: 0.34 },
  };

  return {
    ...plan,
    overlays,
    headline: { ...plan.headline, scrim: disabledScrim },
    subhead: { ...plan.subhead, scrim: disabledScrim },
    cta: { ...plan.cta, scrim: disabledScrim },
  };
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

    const { adSpec, imageUrl, imageBase64, mimeType } = result;
    const template = getTemplateById(adSpec.templateId) || getTemplateById('bold-sale');
    if (!template) return;

    const slots = mapTemplateToFormat(template, formatId);
    const textColor = adSpec.colors.text || '#FFFFFF';
    const rawPlan: PlacementPlan | undefined = adSpec.metadata?.placementPlan;
    const placementPlan: PlacementPlan | undefined = rawPlan ? normalizePlacementPlan(rawPlan) : undefined;
    const preferredAlignment =
      adSpec.metadata?.placementHints?.preferredAlignment || 'auto';

    const bgSlot = slots.find((s) => s.type === 'background');
    if (bgSlot) {
      const imgSrc = imageBase64
        ? `data:${mimeType || 'image/png'};base64,${imageBase64}`
        : imageUrl || '';

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

      if (placementPlan.overlays) {
        addGradientOverlays(canvas, addLayer, placementPlan.overlays, canvasWidth, canvasHeight);
      }

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
        fill: placementPlan.headline.color || headlineBaseStyle.fill,
        textAlign: placementPlan.headline.align,
        lineHeight: 1.03,
        shadow: buildTextShadow(),
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
        fill: placementPlan.headline.color || headlineBaseStyle.fill,
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
        fill: placementPlan.subhead.color || subheadBaseStyle.fill,
        textAlign: placementPlan.subhead.align,
        lineHeight: 1.2,
        shadow: buildTextShadow(),
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
        fill: placementPlan.subhead.color || subheadBaseStyle.fill,
        textAlign: placementPlan.subhead.align,
        fontWeight: 'normal',
      });

      addScrimIfNeeded(canvas, addLayer, 'CTA', placementPlan.cta, canvasWidth, canvasHeight);
      const ctaTextSize = clamp(Math.round(headlineSize * 0.34), 14, 30);
      const subheadBottom = (subheadTextbox.top || subheadTop) + (subheadTextbox.height || maxSubheadHeight);
      const minCtaTop = subheadBottom + laneGap;
      const ctaTop = Math.max(ctaPx.top, minCtaTop);
      const ctaFill = placementPlan.cta.buttonColor || adSpec.colors.accent || '#132B20';
      const ctaStrip = new Rect({
        left: ctaPx.left,
        top: ctaTop,
        width: ctaPx.width,
        height: ctaPx.height,
        fill: ctaFill,
        rx: placementPlan.cta.radius ?? 999,
        ry: placementPlan.cta.radius ?? 999,
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
        fill: placementPlan.cta.textColor || placementPlan.cta.color || headlineBaseStyle.fill,
        textAlign: placementPlan.cta.align || 'center',
        lineHeight: 1.08,
      });

      canvas.add(ctaText);

      // Pill hugs the text: re-fit width to measured text content after layout.
      refreshTextboxMetrics(ctaText);
      const measuredTextWidth =
        typeof ctaText.calcTextWidth === 'function'
          ? ctaText.calcTextWidth()
          : ctaText.width || ctaPx.width;
      const horizontalPadding = Math.max(canvasWidth * 0.028, ctaTextSize * 0.9);
      const verticalPadding = Math.max(canvasHeight * 0.012, ctaTextSize * 0.55);
      const pillWidth = Math.min(ctaPx.width, measuredTextWidth + horizontalPadding * 2);
      const pillHeight = ctaTextSize + verticalPadding * 2;
      const alignment = placementPlan.cta.align || 'center';
      const pillLeft =
        alignment === 'center'
          ? ctaPx.left + (ctaPx.width - pillWidth) / 2
          : alignment === 'right'
            ? ctaPx.left + ctaPx.width - pillWidth
            : ctaPx.left;

      ctaStrip.set({
        left: pillLeft,
        top: ctaTop,
        width: pillWidth,
        height: pillHeight,
      });
      ctaStrip.setCoords();

      ctaText.set({
        left: pillLeft,
        width: pillWidth,
        top: ctaTop + verticalPadding,
      });
      refreshTextboxMetrics(ctaText);
      const ctaLayerId = addLayer({ type: 'text', name: 'CTA', fabricObject: ctaText });
      useLayerStore.getState().updateTextStyle(ctaLayerId, {
        ...headlineBaseStyle,
        fontSize: ctaTextSize,
        fill: placementPlan.cta.textColor || placementPlan.cta.color || headlineBaseStyle.fill,
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
