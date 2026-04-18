import { describe, it, expect } from 'vitest';
import { calculateContrastRatio } from './contrast';

describe('calculateContrastRatio', () => {
  it('returns 21 for black and white', () => {
    expect(calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colors', () => {
    expect(calculateContrastRatio('#ff6a3d', '#ff6a3d')).toBeCloseTo(1, 1);
  });

  it('is commutative', () => {
    const a = calculateContrastRatio('#7c3aed', '#ffffff');
    const b = calculateContrastRatio('#ffffff', '#7c3aed');
    expect(a).toBeCloseTo(b, 5);
  });

  it('yellow on white has low contrast', () => {
    expect(calculateContrastRatio('#ffff00', '#ffffff')).toBeLessThan(2);
  });
});
