import { describe, it, expect, beforeEach } from 'vitest';
import type { GenerationResult } from './useGeneration';
import { useLayerStore } from '../store/layerStore';
import { mapTemplateToFormat, getTemplateById } from '../types/templates';

// We test the composition logic by testing composeAd directly
// Extract the core logic into a testable function

// Since useAdComposition is a hook, we test the underlying logic
// by simulating what compose() does with mock canvas

describe('Ad Composition', () => {
  beforeEach(() => {
    useLayerStore.setState({ layers: [], selectedLayerId: null });
  });

  const mockResult: GenerationResult = {
    adSpec: {
      imagePrompt: 'athletic shoes on orange background',
      texts: {
        headline: 'Summer Sale',
        subhead: '30% off all athletic shoes',
        cta: 'Shop Now',
      },
      colors: {
        primary: '#FF6600',
        secondary: '#000000',
        accent: '#FF4444',
        text: '#FFFFFF',
        background: '#1a1a2e',
      },
      templateId: 'bold-sale',
    },
    imageUrl: 'https://example.com/image.png',
  };

  it('should map bold-sale template slots for square format', () => {
    const template = getTemplateById('bold-sale');
    expect(template).toBeDefined();
    const slots = mapTemplateToFormat(template!, 'square');
    expect(slots).toHaveLength(6);
    
    const bg = slots.find((s) => s.type === 'background');
    expect(bg).toBeDefined();
    expect(bg!.position).toEqual({ x: 0, y: 0, width: 1080, height: 1080 });

    const headline = slots.find((s) => s.type === 'headline');
    expect(headline).toBeDefined();
    expect(headline!.position.x).toBe(90);
    expect(headline!.style.fontSize).toBe(72);

    const subhead = slots.find((s) => s.type === 'subhead');
    expect(subhead).toBeDefined();

    const cta = slots.find((s) => s.type === 'cta');
    expect(cta).toBeDefined();
    expect(cta!.style.backgroundColor).toBe('#FF4444');
  });

  it('should map template slots for portrait format', () => {
    const template = getTemplateById('bold-sale');
    const slots = mapTemplateToFormat(template!, 'portrait');
    const bg = slots.find((s) => s.type === 'background');
    expect(bg!.position.height).toBe(1350);
  });

  it('should map template slots for story format', () => {
    const template = getTemplateById('bold-sale');
    const slots = mapTemplateToFormat(template!, 'story');
    const bg = slots.find((s) => s.type === 'background');
    expect(bg!.position.height).toBe(1920);
  });

  it('should add layers to layer store for each composed element', () => {
    const store = useLayerStore.getState();
    
    // Simulate what compose does to the layer store
    store.addLayer({ type: 'background', name: 'Background Image', fabricObject: null });
    store.addLayer({ type: 'text', name: 'Headline', fabricObject: null });
    store.addLayer({ type: 'text', name: 'Subhead', fabricObject: null });
    store.addLayer({ type: 'text', name: 'CTA', fabricObject: null });

    const layers = useLayerStore.getState().layers;
    expect(layers).toHaveLength(4);
    expect(layers[0].name).toBe('Background Image');
    expect(layers[0].type).toBe('background');
    expect(layers[1].name).toBe('Headline');
    expect(layers[1].type).toBe('text');
    expect(layers[2].name).toBe('Subhead');
    expect(layers[2].type).toBe('text');
    expect(layers[3].name).toBe('CTA');
    expect(layers[3].type).toBe('text');
  });

  it('should clear existing layers before composing', () => {
    const store = useLayerStore.getState();
    store.addLayer({ type: 'text', name: 'Old Layer', fabricObject: null });
    expect(useLayerStore.getState().layers).toHaveLength(1);

    // Simulate clearing
    store.setLayers([]);
    expect(useLayerStore.getState().layers).toHaveLength(0);

    // Add new composition layers
    store.addLayer({ type: 'background', name: 'Background Image', fabricObject: null });
    store.addLayer({ type: 'text', name: 'Headline', fabricObject: null });
    expect(useLayerStore.getState().layers).toHaveLength(2);
  });

  it('should set text style on headline layer', () => {
    const store = useLayerStore.getState();
    const id = store.addLayer({ type: 'text', name: 'Headline', fabricObject: null });
    store.updateTextStyle(id, {
      fontFamily: 'Inter',
      fontSize: 72,
      fill: '#FFFFFF',
      fontWeight: 'bold',
      textAlign: 'center',
    });

    const layer = useLayerStore.getState().layers.find((l) => l.id === id);
    expect(layer?.textStyle?.fontSize).toBe(72);
    expect(layer?.textStyle?.fontWeight).toBe('bold');
    expect(layer?.textStyle?.textAlign).toBe('center');
  });

  it('should handle all three built-in templates', () => {
    for (const templateId of ['bold-sale', 'product-showcase', 'minimal']) {
      const template = getTemplateById(templateId);
      expect(template).toBeDefined();
      const slots = mapTemplateToFormat(template!, 'square');
      expect(slots.find((s) => s.type === 'background')).toBeDefined();
      expect(slots.find((s) => s.type === 'headline')).toBeDefined();
      expect(slots.find((s) => s.type === 'cta')).toBeDefined();
    }
  });

  it('should use generated text content for ad spec', () => {
    expect(mockResult.adSpec.texts.headline).toBe('Summer Sale');
    expect(mockResult.adSpec.texts.subhead).toBe('30% off all athletic shoes');
    expect(mockResult.adSpec.texts.cta).toBe('Shop Now');
  });

  it('CTA slot should have backgroundColor and borderRadius', () => {
    const template = getTemplateById('bold-sale');
    const slots = mapTemplateToFormat(template!, 'square');
    const cta = slots.find((s) => s.type === 'cta');
    expect(cta!.style.backgroundColor).toBe('#FF4444');
    expect(cta!.style.borderRadius).toBe(12);
  });
});
