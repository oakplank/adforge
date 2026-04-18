import { describe, it, expect } from 'vitest';
import { SAFE_ZONES, getSafeZonePixels } from './safeZones';

describe('SAFE_ZONES', () => {
  it('has square, portrait, story, and reel formats', () => {
    expect(Object.keys(SAFE_ZONES)).toEqual(
      expect.arrayContaining(['square', 'portrait', 'story', 'reel'])
    );
  });

  it('story has bottomMargin >= 0.30', () => {
    expect(SAFE_ZONES.story.bottomMargin).toBeGreaterThanOrEqual(0.3);
  });

  it('reel has bottomMargin >= 0.30', () => {
    expect(SAFE_ZONES.reel.bottomMargin).toBeGreaterThanOrEqual(0.3);
  });

  it('reel has rightMargin for UI overlay', () => {
    expect(SAFE_ZONES.reel.rightMargin).toBeGreaterThan(0);
  });
});

describe('getSafeZonePixels', () => {
  const W = 1080;
  const H = 1920;

  it('returns symmetric margins for square', () => {
    const sz = getSafeZonePixels('square', 1080, 1080);
    expect(sz.titleSafe.top).toBe(sz.titleSafe.bottom);
    expect(sz.titleSafe.left).toBe(sz.titleSafe.right);
  });

  it('returns asymmetric top/bottom for story format', () => {
    const sz = getSafeZonePixels('story', W, H);
    expect(sz.titleSafe.bottom).toBeGreaterThan(sz.titleSafe.top);
  });

  it('story bottom margin is >= 30% of canvas height', () => {
    const sz = getSafeZonePixels('story', W, H);
    expect(sz.titleSafe.bottom).toBeGreaterThanOrEqual(H * 0.3);
  });

  it('returns asymmetric top/bottom for reel format', () => {
    const sz = getSafeZonePixels('reel', W, H);
    expect(sz.titleSafe.bottom).toBeGreaterThan(sz.titleSafe.top);
  });

  it('reel has wider right margin than left', () => {
    const sz = getSafeZonePixels('reel', W, H);
    expect(sz.titleSafe.right).toBeGreaterThan(sz.titleSafe.left);
  });

  it('falls back to square for unknown format', () => {
    const sz = getSafeZonePixels('unknown', 1080, 1080);
    expect(sz.titleSafe.top).toBe(108);
  });

  it('action safe zones are symmetric for all formats', () => {
    for (const fmt of ['square', 'portrait', 'story', 'reel']) {
      const sz = getSafeZonePixels(fmt, W, H);
      expect(sz.actionSafe.top).toBe(sz.actionSafe.bottom);
    }
  });
});
