import { describe, it, expect } from 'vitest';
import { getSafeZonePixels } from '../types/safeZones';

describe('getSafeZonePixels', () => {
  it('returns correct title safe margins for square format', () => {
    const zones = getSafeZonePixels('square', 1080, 1080);
    expect(zones.titleSafe.top).toBe(108);
    expect(zones.titleSafe.left).toBe(108);
    expect(zones.titleSafe.bottom).toBe(108);
    expect(zones.titleSafe.right).toBe(108);
  });

  it('returns correct action safe margins for square format', () => {
    const zones = getSafeZonePixels('square', 1080, 1080);
    expect(zones.actionSafe.top).toBe(54);
    expect(zones.actionSafe.left).toBe(54);
  });

  it('uses asymmetric margins for story format', () => {
    const zones = getSafeZonePixels('story', 1080, 1920);
    // Story has 14% top, 35% bottom, 14% title safe for left/right
    expect(zones.titleSafe.top).toBe(1920 * 0.14);
    expect(zones.titleSafe.bottom).toBe(1920 * 0.35);
    expect(zones.titleSafe.left).toBe(1080 * 0.14);
  });

  it('adjusts safe zones for portrait format', () => {
    const zones = getSafeZonePixels('portrait', 1080, 1350);
    expect(zones.titleSafe.top).toBe(135);
    expect(zones.titleSafe.left).toBe(108);
    expect(zones.titleSafe.bottom).toBe(135);
  });

  it('falls back to square config for unknown format', () => {
    const zones = getSafeZonePixels('unknown', 500, 500);
    expect(zones.titleSafe.top).toBe(50);
  });

  it('safe zones differ between story and square', () => {
    const square = getSafeZonePixels('square', 1080, 1080);
    const story = getSafeZonePixels('story', 1080, 1920);
    // Story has larger title safe percentage
    expect(story.titleSafe.top / 1920).toBeGreaterThan(square.titleSafe.top / 1080);
  });
});
