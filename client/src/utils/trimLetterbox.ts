// Detects and trims letterbox/pillarbox bars from an image.
//
// Image models sometimes return a square canvas that actually contains a
// non-square composition with solid bars on top/bottom or left/right. Those
// bars trash cover-scaling logic: the image ends up technically square but
// visually smaller than the frame. We scan inward from each edge looking for
// rows/cols whose pixels are all within a tight luminance+chroma tolerance,
// then crop to the inner content rect.

// A letterbox bar might be pure solid OR a smooth gradient. To catch both
// cases without eating real photo content, we check two signals:
//   1) adjacent-pixel diff stays below `stepTolerance` (no sharp edges)
//   2) total luminance span across the line stays below `spanTolerance`
// Pure content almost always breaks at least one of these.

function rowIsBarLike(
  data: Uint8ClampedArray,
  width: number,
  y: number,
  stepTolerance: number,
  spanTolerance: number,
): boolean {
  let minY = 255;
  let maxY = 0;
  let prevR = data[y * width * 4];
  let prevG = data[y * width * 4 + 1];
  let prevB = data[y * width * 4 + 2];
  for (let x = 0; x < width; x += 1) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    if (x > 0) {
      if (
        Math.abs(r - prevR) > stepTolerance ||
        Math.abs(g - prevG) > stepTolerance ||
        Math.abs(b - prevB) > stepTolerance
      ) {
        return false;
      }
    }
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < minY) minY = lum;
    if (lum > maxY) maxY = lum;
    prevR = r;
    prevG = g;
    prevB = b;
  }
  return maxY - minY <= spanTolerance;
}

function colIsBarLike(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  stepTolerance: number,
  spanTolerance: number,
): boolean {
  let minY = 255;
  let maxY = 0;
  let prevR = data[x * 4];
  let prevG = data[x * 4 + 1];
  let prevB = data[x * 4 + 2];
  for (let y = 0; y < height; y += 1) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    if (y > 0) {
      if (
        Math.abs(r - prevR) > stepTolerance ||
        Math.abs(g - prevG) > stepTolerance ||
        Math.abs(b - prevB) > stepTolerance
      ) {
        return false;
      }
    }
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < minY) minY = lum;
    if (lum > maxY) maxY = lum;
    prevR = r;
    prevG = g;
    prevB = b;
  }
  return maxY - minY <= spanTolerance;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for trim'));
    img.src = src;
  });
}

export interface TrimResult {
  src: string;
  trimmed: boolean;
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
}

// Returns a data URL with letterbox bars removed, or the original src if no
// meaningful bars were detected. `stepTolerance` is the max allowed diff
// between adjacent pixels (smoothness), `spanTolerance` is the max allowed
// luminance range across the whole line. Together they catch both solid and
// gradient bars while rejecting real content (which has sharp edges and
// large luminance range).
export async function trimLetterbox(
  src: string,
  stepTolerance = 8,
  spanTolerance = 40,
): Promise<TrimResult> {
  const noTrim: TrimResult = {
    src,
    trimmed: false,
    cropTop: 0,
    cropBottom: 0,
    cropLeft: 0,
    cropRight: 0,
  };

  try {
    const img = await loadImageElement(src);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w === 0 || h === 0) return noTrim;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return noTrim;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, w, h);

    let top = 0;
    while (top < h && rowIsBarLike(data, w, top, stepTolerance, spanTolerance)) top += 1;

    let bottom = h - 1;
    while (bottom > top && rowIsBarLike(data, w, bottom, stepTolerance, spanTolerance)) bottom -= 1;

    let left = 0;
    while (left < w && colIsBarLike(data, w, h, left, stepTolerance, spanTolerance)) left += 1;

    let right = w - 1;
    while (right > left && colIsBarLike(data, w, h, right, stepTolerance, spanTolerance)) right -= 1;

    // Require at least 1.5% of the dimension to be considered a real bar, so
    // we don't waste render on trivial differences.
    const minBarH = Math.max(6, Math.round(h * 0.015));
    const minBarW = Math.max(6, Math.round(w * 0.015));
    const trimTop = top >= minBarH ? top : 0;
    const trimBottom = h - 1 - bottom >= minBarH ? h - 1 - bottom : 0;
    const trimLeft = left >= minBarW ? left : 0;
    const trimRight = w - 1 - right >= minBarW ? w - 1 - right : 0;

    if (!trimTop && !trimBottom && !trimLeft && !trimRight) return noTrim;

    const newW = w - trimLeft - trimRight;
    const newH = h - trimTop - trimBottom;
    if (newW <= 0 || newH <= 0) return noTrim;

    const out = document.createElement('canvas');
    out.width = newW;
    out.height = newH;
    const outCtx = out.getContext('2d');
    if (!outCtx) return noTrim;
    outCtx.drawImage(img, -trimLeft, -trimTop);

    return {
      src: out.toDataURL('image/png'),
      trimmed: true,
      cropTop: trimTop,
      cropBottom: trimBottom,
      cropLeft: trimLeft,
      cropRight: trimRight,
    };
  } catch {
    return noTrim;
  }
}
