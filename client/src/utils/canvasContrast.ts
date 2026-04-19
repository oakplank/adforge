// Luminance sampling for contrast-aware overlay text.
//
// When you drop a Text layer onto an image, the right fill color depends on
// what's behind it. Pure white on a white sky is unreadable; pure black on a
// dark product is equally bad. We sample the pixels under the planned text
// rect and return a sensible fill + drop-shadow recipe that stays legible.
//
// Fabric's lower-canvas element is just a raw 2D canvas holding the latest
// render — we read it directly rather than asking Fabric for pixel access
// (which would round-trip through toDataURL).

import type { Canvas } from 'fabric';

interface ContrastResult {
  // Hex fill recommendation ('#ffffff' or '#111111').
  fill: string;
  // Whether a text shadow is warranted (true when the region is mixed/noisy).
  needsShadow: boolean;
  // Average luminance 0-255 for diagnostics / scrim alpha decisions.
  averageLuminance: number;
  // Std dev of luminance — higher means more texture, favor shadow.
  luminanceStdDev: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Sample a rectangular region on the rendered canvas and recommend a fill.
export function sampleRegionContrast(
  canvas: Canvas | null,
  rect: { left: number; top: number; width: number; height: number },
): ContrastResult {
  const fallback: ContrastResult = {
    fill: '#ffffff',
    needsShadow: true,
    averageLuminance: 0,
    luminanceStdDev: 0,
  };

  if (!canvas) return fallback;

  const lowerEl = (canvas as unknown as { lowerCanvasEl?: HTMLCanvasElement })
    .lowerCanvasEl;
  if (!lowerEl) return fallback;

  const ctx = lowerEl.getContext('2d', { willReadFrequently: true });
  if (!ctx) return fallback;

  // Fabric's lower canvas is scaled to the CSS display size but stores render
  // pixels at the logical canvas dimensions. We convert rect coords (in
  // canvas/logical space) to the element's device pixels.
  const dpr = lowerEl.width / (canvas.width || lowerEl.width);
  const sampleLeft = clamp(Math.floor(rect.left * dpr), 0, lowerEl.width - 1);
  const sampleTop = clamp(Math.floor(rect.top * dpr), 0, lowerEl.height - 1);
  const sampleWidth = clamp(
    Math.ceil(rect.width * dpr),
    1,
    lowerEl.width - sampleLeft,
  );
  const sampleHeight = clamp(
    Math.ceil(rect.height * dpr),
    1,
    lowerEl.height - sampleTop,
  );

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(sampleLeft, sampleTop, sampleWidth, sampleHeight);
  } catch {
    return fallback;
  }

  const { data } = imageData;
  // Subsample every 4th pixel for speed on large rects.
  const stride = 4 * 4;
  let sum = 0;
  let sumSquares = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += stride) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sum += lum;
    sumSquares += lum * lum;
    count += 1;
  }

  if (count === 0) return fallback;

  const averageLuminance = sum / count;
  const variance = Math.max(0, sumSquares / count - averageLuminance * averageLuminance);
  const luminanceStdDev = Math.sqrt(variance);

  // Dark-leaning regions → white text. Bright regions → near-black text.
  // We bias slightly toward white since most ad imagery is photographic and
  // white tends to read as "premium" against warm tones.
  const fill = averageLuminance < 150 ? '#ffffff' : '#111111';

  // Shadow helps whenever the background is either mid-tone or noisy.
  const mid = averageLuminance > 60 && averageLuminance < 210;
  const noisy = luminanceStdDev > 32;
  const needsShadow = mid || noisy;

  return { fill, needsShadow, averageLuminance, luminanceStdDev };
}
