import { describe, expect, it } from 'vitest';
import { buildPlacementPlanFromImageData } from './imagePlacementAnalyzer';

function solidImage(width: number, height: number, r: number, g: number, b: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const idx = i * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }
  return { data, width, height };
}

function noisyTopImage(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const noise = y < height * 0.3 ? (x * y) % 255 : 45;
      data[idx] = noise;
      data[idx + 1] = noise;
      data[idx + 2] = noise;
      data[idx + 3] = 255;
    }
  }

  return { data, width, height };
}

describe('buildPlacementPlanFromImageData', () => {
  it('chooses dark text on very light imagery', () => {
    const image = solidImage(220, 220, 245, 245, 245);
    const plan = buildPlacementPlanFromImageData(image, { formatId: 'square', objective: 'awareness' });

    expect(plan.headline.color).toBe('#141414');
    expect(plan.subhead.color).toBe('#141414');
  });

  it('chooses light text on dark imagery', () => {
    const image = solidImage(220, 220, 20, 20, 20);
    const plan = buildPlacementPlanFromImageData(image, { formatId: 'square', objective: 'offer' });

    expect(plan.headline.color).toBe('#F8F8F4');
    expect(plan.cta.textColor).toBeTruthy();
  });

  it('returns bottom CTA placement with confidence score', () => {
    const image = noisyTopImage(260, 260);
    const plan = buildPlacementPlanFromImageData(image, { formatId: 'portrait', objective: 'offer' });

    expect(plan.cta.y).toBeGreaterThan(0.7);
    expect(plan.confidence).toBeGreaterThan(0);
    expect(plan.rationale.length).toBeGreaterThan(0);
  });
});
