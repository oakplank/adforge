import { describe, it, expect } from 'vitest';
import { AD_FORMATS, DEFAULT_FORMAT } from './formats';

describe('AD_FORMATS', () => {
  it('includes square, portrait, story, and reel', () => {
    const ids = AD_FORMATS.map((f) => f.id);
    expect(ids).toContain('square');
    expect(ids).toContain('portrait');
    expect(ids).toContain('story');
    expect(ids).toContain('reel');
  });

  it('reel has 1080x1920 dimensions', () => {
    const reel = AD_FORMATS.find((f) => f.id === 'reel')!;
    expect(reel.width).toBe(1080);
    expect(reel.height).toBe(1920);
  });

  it('story and reel have same dimensions but are distinct formats', () => {
    const story = AD_FORMATS.find((f) => f.id === 'story')!;
    const reel = AD_FORMATS.find((f) => f.id === 'reel')!;
    expect(story.width).toBe(reel.width);
    expect(story.height).toBe(reel.height);
    expect(story.id).not.toBe(reel.id);
  });

  it('default format is square', () => {
    expect(DEFAULT_FORMAT.id).toBe('square');
  });
});
