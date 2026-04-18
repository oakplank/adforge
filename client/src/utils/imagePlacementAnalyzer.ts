export type HorizontalAlign = 'left' | 'center' | 'right';

export interface PlacementScrim {
  enabled: boolean;
  color: string;
  opacity: number;
  padding: number;
}

export interface PlacementTextBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  align: HorizontalAlign;
  color: string;
  scrim: PlacementScrim;
}

export interface PlacementCtaBlock extends PlacementTextBlock {
  buttonStyle: 'solid' | 'outline' | 'ghost';
  buttonColor: string;
  textColor: string;
  radius: number;
}

export interface PlacementPlan {
  headline: PlacementTextBlock;
  subhead: PlacementTextBlock;
  cta: PlacementCtaBlock;
  confidence: number;
  rationale: string[];
}

export interface PlacementHints {
  formatId?: 'square' | 'portrait' | 'story';
  objective?: 'offer' | 'launch' | 'awareness';
  preferredAlignment?: HorizontalAlign | 'auto';
  preferredHeadlineBand?: 'top' | 'upper';
  avoidCenter?: boolean;
  accentColor?: string;
  backgroundColor?: string;
}

interface PixelLikeImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

interface ZoneSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  band: 'top' | 'middle' | 'bottom';
  align: HorizontalAlign;
}

interface ZoneStats {
  zone: ZoneSpec;
  clutter: number;
  meanLuminance: number;
  contrastWhite: number;
  contrastBlack: number;
  preferredTextColor: string;
  preferredContrast: number;
}

const SAFE_WHITE = '#F8F8F4';
const SAFE_BLACK = '#141414';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function luminanceFromRgb(r: number, g: number, b: number): number {
  const linear = [r, g, b].map((component) => {
    const s = component / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function parseHexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return [255, 255, 255];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getZones(formatId: PlacementHints['formatId']): ZoneSpec[] {
  const topY = formatId === 'story' ? 0.1 : 0.06;
  const upperY = formatId === 'story' ? 0.22 : 0.18;
  const bottomY = formatId === 'story' ? 0.8 : 0.76;

  return [
    { id: 'top-left', x: 0.07, y: topY, w: 0.4, h: 0.2, band: 'top', align: 'left' },
    { id: 'top-center', x: 0.17, y: topY, w: 0.66, h: 0.2, band: 'top', align: 'center' },
    { id: 'top-right', x: 0.53, y: topY, w: 0.4, h: 0.2, band: 'top', align: 'right' },
    { id: 'upper-left', x: 0.07, y: upperY, w: 0.42, h: 0.18, band: 'middle', align: 'left' },
    { id: 'upper-right', x: 0.51, y: upperY, w: 0.42, h: 0.18, band: 'middle', align: 'right' },
    { id: 'bottom-left', x: 0.08, y: bottomY, w: 0.36, h: 0.12, band: 'bottom', align: 'left' },
    { id: 'bottom-center', x: 0.2, y: bottomY, w: 0.6, h: 0.12, band: 'bottom', align: 'center' },
    { id: 'bottom-right', x: 0.56, y: bottomY, w: 0.36, h: 0.12, band: 'bottom', align: 'right' },
  ];
}

function measureZone(image: PixelLikeImageData, zone: ZoneSpec): ZoneStats {
  const x0 = Math.floor(zone.x * image.width);
  const y0 = Math.floor(zone.y * image.height);
  const x1 = Math.min(image.width, Math.ceil((zone.x + zone.w) * image.width));
  const y1 = Math.min(image.height, Math.ceil((zone.y + zone.h) * image.height));

  let lumSum = 0;
  let lumSqSum = 0;
  let edgeSum = 0;
  let count = 0;

  const getLumAt = (x: number, y: number): number => {
    const idx = (y * image.width + x) * 4;
    return luminanceFromRgb(image.data[idx], image.data[idx + 1], image.data[idx + 2]);
  };

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const lum = getLumAt(x, y);
      lumSum += lum;
      lumSqSum += lum * lum;
      count += 1;

      if (x + 1 < x1) {
        edgeSum += Math.abs(lum - getLumAt(x + 1, y));
      }
      if (y + 1 < y1) {
        edgeSum += Math.abs(lum - getLumAt(x, y + 1));
      }
    }
  }

  const meanLuminance = count > 0 ? lumSum / count : 0.5;
  const variance = count > 0 ? Math.max(0, lumSqSum / count - meanLuminance * meanLuminance) : 0;
  const edgeDensity = count > 0 ? edgeSum / count : 0;

  const clutter = clamp(variance * 8 + edgeDensity * 1.6, 0, 1);
  const contrastWhite = contrastRatio(1, meanLuminance);
  const contrastBlack = contrastRatio(0, meanLuminance);
  const preferredTextColor = contrastWhite >= contrastBlack ? SAFE_WHITE : SAFE_BLACK;
  const preferredContrast = Math.max(contrastWhite, contrastBlack);

  return {
    zone,
    clutter,
    meanLuminance,
    contrastWhite,
    contrastBlack,
    preferredTextColor,
    preferredContrast,
  };
}

function scoreHeadlineZone(stat: ZoneStats, hints: PlacementHints): number {
  let score = stat.clutter * 1.7;

  if (stat.zone.band !== 'top') {
    score += hints.preferredHeadlineBand === 'upper' ? 0.12 : 0.24;
  }

  if (hints.preferredAlignment && hints.preferredAlignment !== 'auto' && stat.zone.align !== hints.preferredAlignment) {
    score += 0.3;
  }

  if (hints.avoidCenter && stat.zone.align === 'center') {
    score += 0.4;
  }

  if (stat.preferredContrast < 4.5) {
    score += 0.25;
  }

  return score;
}

function scoreCtaZone(stat: ZoneStats, hints: PlacementHints): number {
  let score = stat.clutter * 1.6;

  if (stat.zone.band !== 'bottom') {
    score += 0.28;
  }

  if (hints.objective === 'offer' && stat.zone.align !== 'center') {
    score += 0.08;
  }

  if (hints.avoidCenter && hints.objective !== 'offer' && stat.zone.align === 'center') {
    score += 0.22;
  }

  if (stat.preferredContrast < 4.5) {
    score += 0.18;
  }

  return score;
}

function chooseBest(candidates: ZoneStats[], scorer: (candidate: ZoneStats) => number): ZoneStats {
  let winner = candidates[0];
  let bestScore = scorer(winner);

  for (let i = 1; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const score = scorer(candidate);
    if (score < bestScore) {
      winner = candidate;
      bestScore = score;
    }
  }

  return winner;
}

function getButtonTextColor(buttonColor: string): string {
  const [r, g, b] = parseHexToRgb(buttonColor);
  const lum = luminanceFromRgb(r, g, b);
  return contrastRatio(1, lum) >= contrastRatio(0, lum) ? SAFE_WHITE : SAFE_BLACK;
}

function buildScrim(clutter: number, contrast: number): PlacementScrim {
  const shouldUse = clutter > 0.24 || contrast < 4.8;
  if (!shouldUse) {
    return { enabled: false, color: '#000000', opacity: 0, padding: 0.012 };
  }

  return {
    enabled: true,
    color: contrast < 4.8 ? '#000000' : '#0E1218',
    opacity: clamp(0.18 + clutter * 0.55 + (contrast < 4.8 ? 0.12 : 0), 0.2, 0.62),
    padding: 0.016,
  };
}

function buildStructuredLane(
  formatId: PlacementHints['formatId'],
  align: HorizontalAlign
): { headline: ZoneSpec; subhead: ZoneSpec; cta: ZoneSpec } {
  const isStory = formatId === 'story';
  const margin = isStory ? 0.06 : 0.055;
  const sideWidth = isStory ? 0.38 : 0.34;
  const centerWidth = isStory ? 0.68 : 0.64;
  const laneWidth = align === 'center' ? centerWidth : sideWidth;
  const laneX =
    align === 'left'
      ? margin
      : align === 'right'
        ? 1 - margin - laneWidth
        : (1 - laneWidth) / 2;
  const topY = isStory ? 0.07 : 0.065;
  const headlineZoneHeight = isStory ? 0.19 : 0.2;
  const subY = topY + headlineZoneHeight + (isStory ? 0.03 : 0.028);
  const subZoneHeight = isStory ? 0.14 : 0.13;
  const ctaY = isStory ? 0.84 : 0.82;
  const ctaWidth = align === 'center' ? Math.min(0.38, laneWidth * 0.58) : Math.min(0.26, laneWidth * 0.72);
  const ctaX =
    align === 'center'
      ? 0.5 - ctaWidth / 2
      : align === 'right'
        ? laneX + laneWidth - ctaWidth
        : laneX;

  return {
    headline: {
      id: `lane-headline-${align}`,
      x: laneX,
      y: topY,
      w: laneWidth,
      h: headlineZoneHeight,
      band: 'top',
      align,
    },
    subhead: {
      id: `lane-subhead-${align}`,
      x: laneX,
      y: subY,
      w: laneWidth,
      h: subZoneHeight,
      band: 'middle',
      align,
    },
    cta: {
      id: `lane-cta-${align}`,
      x: ctaX,
      y: ctaY,
      w: ctaWidth,
      h: isStory ? 0.07 : 0.075,
      band: 'bottom',
      align,
    },
  };
}

function laneAlignCandidates(hints: PlacementHints): HorizontalAlign[] {
  if (hints.preferredAlignment && hints.preferredAlignment !== 'auto') {
    const opposite: Record<HorizontalAlign, HorizontalAlign> = {
      left: 'right',
      right: 'left',
      center: 'center',
    };
    const list: HorizontalAlign[] = [hints.preferredAlignment, opposite[hints.preferredAlignment]];
    if (!hints.avoidCenter && hints.preferredAlignment !== 'center') {
      list.push('center');
    }
    return Array.from(new Set(list));
  }

  if (hints.avoidCenter) {
    return ['left', 'right'];
  }

  if (hints.objective === 'offer') {
    return ['center', 'left', 'right'];
  }

  return ['left', 'right', 'center'];
}

function scoreStructuredLane(
  headlineStat: ZoneStats,
  subheadStat: ZoneStats,
  ctaStat: ZoneStats,
  hints: PlacementHints
): number {
  let score = headlineStat.clutter * 1.65 + subheadStat.clutter * 1.4 + ctaStat.clutter * 1.05;
  const minContrast = Math.min(
    headlineStat.preferredContrast,
    subheadStat.preferredContrast,
    ctaStat.preferredContrast
  );

  if (minContrast < 4.5) {
    score += (4.5 - minContrast) * 0.24;
  }

  if (
    hints.preferredAlignment &&
    hints.preferredAlignment !== 'auto' &&
    headlineStat.zone.align !== hints.preferredAlignment
  ) {
    score += 0.34;
  }

  if (hints.avoidCenter && headlineStat.zone.align === 'center') {
    score += 0.46;
  }

  if (hints.objective === 'offer' && headlineStat.zone.align === 'center') {
    score -= 0.05;
  }

  if (Math.abs(headlineStat.meanLuminance - subheadStat.meanLuminance) > 0.22) {
    score += 0.08;
  }

  return score;
}

function chooseBestStructuredLane(
  image: PixelLikeImageData,
  hints: PlacementHints
): {
  lane: { headline: ZoneSpec; subhead: ZoneSpec; cta: ZoneSpec };
  headlineStat: ZoneStats;
  subheadStat: ZoneStats;
  ctaStat: ZoneStats;
  totalScore: number;
} | null {
  const candidates = laneAlignCandidates(hints);
  if (candidates.length === 0) return null;

  let best:
    | {
        lane: { headline: ZoneSpec; subhead: ZoneSpec; cta: ZoneSpec };
        headlineStat: ZoneStats;
        subheadStat: ZoneStats;
        ctaStat: ZoneStats;
        totalScore: number;
      }
    | null = null;

  for (const align of candidates) {
    const lane = buildStructuredLane(hints.formatId, align);
    const headlineStat = measureZone(image, lane.headline);
    const subheadStat = measureZone(image, lane.subhead);
    const ctaStat = measureZone(image, lane.cta);
    const totalScore = scoreStructuredLane(headlineStat, subheadStat, ctaStat, hints);

    if (!best || totalScore < best.totalScore) {
      best = { lane, headlineStat, subheadStat, ctaStat, totalScore };
    }
  }

  return best;
}

export function buildPlacementPlanFromImageData(image: PixelLikeImageData, hints: PlacementHints = {}): PlacementPlan {
  const shouldUseStructuredPlanner =
    hints.avoidCenter === true ||
    (hints.preferredAlignment !== undefined && hints.preferredAlignment !== 'auto') ||
    hints.objective === 'launch' ||
    hints.objective === 'awareness';

  if (shouldUseStructuredPlanner) {
    const bestLane = chooseBestStructuredLane(image, hints);
    if (bestLane) {
      const { lane, headlineStat, subheadStat, ctaStat, totalScore } = bestLane;
      const headlineHeight = hints.formatId === 'story' ? 0.13 : 0.14;
      const subheadHeight = hints.formatId === 'story' ? 0.09 : 0.095;
      const subheadY = clamp(
        lane.headline.y + headlineHeight + (hints.formatId === 'story' ? 0.024 : 0.02),
        lane.subhead.y,
        hints.formatId === 'story' ? 0.74 : 0.68
      );

      const baseAccent = hints.accentColor || '#2D6A4F';
      const buttonStyle =
        hints.objective === 'launch'
          ? 'outline'
          : hints.objective === 'awareness'
            ? 'ghost'
            : 'solid';
      const confidence = clamp(
        1 - (totalScore * 0.26 + headlineStat.clutter * 0.22 + ctaStat.clutter * 0.14),
        0.38,
        0.97
      );

      return {
        headline: {
          x: lane.headline.x,
          y: lane.headline.y,
          width: lane.headline.w,
          height: headlineHeight,
          align: lane.headline.align,
          color: headlineStat.preferredTextColor,
          scrim: buildScrim(headlineStat.clutter, headlineStat.preferredContrast),
        },
        subhead: {
          x: lane.subhead.x,
          y: subheadY,
          width: lane.subhead.w,
          height: subheadHeight,
          align: lane.subhead.align,
          color: subheadStat.preferredTextColor,
          scrim: buildScrim(subheadStat.clutter * 0.92, subheadStat.preferredContrast),
        },
        cta: {
          x: lane.cta.x,
          y: lane.cta.y,
          width: lane.cta.w,
          height: hints.formatId === 'story' ? 0.06 : 0.065,
          align: 'center',
          color: getButtonTextColor(baseAccent),
          textColor: getButtonTextColor(baseAccent),
          buttonColor: baseAccent,
          buttonStyle,
          radius: 18,
          scrim: buildScrim(ctaStat.clutter * 0.68, ctaStat.preferredContrast),
        },
        confidence,
        rationale: [
          `Adaptive lane selected on ${lane.headline.align} from per-side clutter and contrast scoring.`,
          `Lane score ${totalScore.toFixed(2)}. Headline clutter ${headlineStat.clutter.toFixed(2)}, subhead clutter ${subheadStat.clutter.toFixed(2)}.`,
          `CTA contrast ${ctaStat.preferredContrast.toFixed(2)} with compact action lane sizing.`,
        ],
      };
    }
  }

  const zones = getZones(hints.formatId);
  const zoneStats = zones.map((zone) => measureZone(image, zone));

  const headlineCandidates = zoneStats.filter((zone) => zone.zone.band !== 'bottom');
  const ctaCandidates = zoneStats.filter((zone) => zone.zone.band === 'bottom');

  const headlineZone = chooseBest(headlineCandidates, (candidate) => scoreHeadlineZone(candidate, hints));
  const ctaZone = chooseBest(ctaCandidates, (candidate) => scoreCtaZone(candidate, hints));

  const headlineHeight = hints.formatId === 'story' ? 0.12 : 0.11;
  const subheadHeight = hints.formatId === 'story' ? 0.08 : 0.07;
  const subheadY = clamp(headlineZone.zone.y + headlineHeight + 0.014, 0.16, 0.68);

  const baseAccent = hints.accentColor || '#ff6a3d';
  const buttonStyle = hints.objective === 'launch' ? 'outline' : hints.objective === 'awareness' ? 'ghost' : 'solid';

  const confidence = clamp(
    1 - (headlineZone.clutter * 0.55 + ctaZone.clutter * 0.35),
    0.35,
    0.98
  );

  return {
    headline: {
      x: headlineZone.zone.x,
      y: headlineZone.zone.y,
      width: headlineZone.zone.w,
      height: headlineHeight,
      align: hints.preferredAlignment && hints.preferredAlignment !== 'auto' ? hints.preferredAlignment : headlineZone.zone.align,
      color: headlineZone.preferredTextColor,
      scrim: buildScrim(headlineZone.clutter, headlineZone.preferredContrast),
    },
    subhead: {
      x: headlineZone.zone.x,
      y: subheadY,
      width: headlineZone.zone.w,
      height: subheadHeight,
      align: hints.preferredAlignment && hints.preferredAlignment !== 'auto' ? hints.preferredAlignment : headlineZone.zone.align,
      color: headlineZone.preferredTextColor,
      scrim: buildScrim(headlineZone.clutter * 0.86, headlineZone.preferredContrast),
    },
    cta: {
      x: ctaZone.zone.align === 'center' ? 0.5 - Math.min(0.58, ctaZone.zone.w) / 2 : ctaZone.zone.x,
      y: ctaZone.zone.y,
      width: Math.min(0.58, ctaZone.zone.w),
      height: hints.formatId === 'story' ? 0.055 : 0.068,
      align: 'center',
      color: getButtonTextColor(baseAccent),
      textColor: getButtonTextColor(baseAccent),
      buttonColor: baseAccent,
      buttonStyle,
      radius: 18,
      scrim: buildScrim(ctaZone.clutter * 0.75, ctaZone.preferredContrast),
    },
    confidence,
    rationale: [
      `Headline zone: ${headlineZone.zone.id} (clutter ${headlineZone.clutter.toFixed(2)}).`,
      `CTA zone: ${ctaZone.zone.id} (clutter ${ctaZone.clutter.toFixed(2)}).`,
      `Text color chosen from luminance analysis (${headlineZone.meanLuminance.toFixed(2)}).`,
    ],
  };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load for placement analysis'));
    image.src = source;
  });
}

export async function analyzeImageForPlacement(source: string, hints: PlacementHints = {}): Promise<PlacementPlan | null> {
  if (typeof document === 'undefined') return null;

  try {
    const image = await loadImage(source);
    const sampleWidth = 420;
    const sampleHeight = Math.max(160, Math.round(sampleWidth * ((image.naturalHeight || image.height) / (image.naturalWidth || image.width))));

    const canvas = document.createElement('canvas');
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
    const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight);

    return buildPlacementPlanFromImageData(
      {
        data: imageData.data,
        width: sampleWidth,
        height: sampleHeight,
      },
      hints
    );
  } catch {
    return null;
  }
}
