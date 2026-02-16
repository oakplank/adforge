import { describe, it, expect } from 'vitest';
import type { Layer, LayerType } from './layers';

describe('Layer types', () => {
  it('Layer type can be constructed', () => {
    const layer: Layer = {
      id: 'layer-1',
      type: 'image',
      name: 'Background',
      zIndex: 0,
      visible: true,
      locked: false,
      opacity: 1,
      fabricObject: null,
    };
    expect(layer.id).toBe('layer-1');
    expect(layer.type).toBe('image');
  });

  it('LayerType includes all expected types', () => {
    const types: LayerType[] = ['image', 'text', 'shape', 'background'];
    expect(types).toHaveLength(4);
  });
});
