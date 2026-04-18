import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('fabric', () => ({
  Canvas: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

import { useCanvas } from './useCanvas';

describe('useCanvas', () => {
  it('returns canvasRef and canvas instance', () => {
    const { result } = renderHook(() => useCanvas());
    expect(result.current.canvasRef).toBeDefined();
    expect(result.current).toHaveProperty('canvas');
  });

  it('accepts custom dimensions', () => {
    const { result } = renderHook(() => useCanvas({ width: 1080, height: 1920 }));
    expect(result.current).toHaveProperty('canvasRef');
    expect(result.current).toHaveProperty('canvas');
  });
});
