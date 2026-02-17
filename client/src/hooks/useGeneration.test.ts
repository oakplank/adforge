// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Must be hoisted before imports
vi.mock('../api/client.js', () => ({
  generateAd: vi.fn(),
  generateImage: vi.fn(),
  saveGeneration: vi.fn(),
}));

vi.mock('../utils/imagePlacementAnalyzer.js', () => ({
  analyzeImageForPlacement: vi.fn().mockResolvedValue(null),
}));

// Now import after mocks are set up
import * as apiClient from '../api/client.js';
import { useGeneration } from './useGeneration.js';

const mockGenerateAd = apiClient.generateAd as Mock;
const mockGenerateImage = apiClient.generateImage as Mock;
const mockSaveGeneration = apiClient.saveGeneration as Mock;

const fakeAdSpec = {
  imagePrompt: 'a cool product',
  texts: { headline: 'Buy Now', subhead: 'Great deal', cta: 'Shop' },
  colors: { primary: '#000', secondary: '#fff', accent: '#f00', text: '#000', background: '#fff' },
  templateId: 'tpl-1',
  metadata: {
    formatConfig: { id: 'sq', aspectRatio: '1:1', width: 1080, height: 1080, safeZoneTop: 0, safeZoneBottom: 0, composition: 'center' },
  },
};

const fakeImgData = { imageUrl: 'https://example.com/img.png' };

describe('useGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateAd.mockResolvedValue(fakeAdSpec);
    mockGenerateImage.mockResolvedValue(fakeImgData);
    mockSaveGeneration.mockResolvedValue({ generation: { id: '1' } });
  });

  it('initial state', () => {
    const { result } = renderHook(() => useGeneration());
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('generates successfully', async () => {
    const { result } = renderHook(() => useGeneration());

    let genResult: unknown;
    await act(async () => {
      genResult = await result.current.generate('test prompt', 'square');
    });

    expect(mockGenerateAd).toHaveBeenCalledWith('test prompt', 'square', undefined);
    expect(mockGenerateImage).toHaveBeenCalledWith(expect.objectContaining({
      prompt: 'a cool product',
      width: 1080,
      height: 1080,
      qualityGate: true,
    }));
    expect(mockSaveGeneration).toHaveBeenCalledTimes(1);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toEqual({
      adSpec: fakeAdSpec,
      imageUrl: 'https://example.com/img.png',
      imageBase64: undefined,
    });
    expect(genResult).toBeTruthy();
  });

  it('passes templateId to generateAd', async () => {
    const { result } = renderHook(() => useGeneration());

    await act(async () => {
      await result.current.generate('prompt', 'portrait', 'tpl-custom');
    });

    expect(mockGenerateAd).toHaveBeenCalledWith('prompt', 'portrait', 'tpl-custom');
  });

  it('handles generateAd error', async () => {
    mockGenerateAd.mockRejectedValue(new Error('Ad generation failed'));
    const { result } = renderHook(() => useGeneration());

    let genResult: unknown;
    await act(async () => {
      genResult = await result.current.generate('prompt', 'square');
    });

    expect(genResult).toBeNull();
    expect(result.current.error).toBe('Ad generation failed');
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.result).toBeNull();
  });

  it('handles generateImage error', async () => {
    mockGenerateImage.mockRejectedValue(new Error('Image generation failed'));
    const { result } = renderHook(() => useGeneration());

    let genResult: unknown;
    await act(async () => {
      genResult = await result.current.generate('prompt', 'square');
    });

    expect(genResult).toBeNull();
    expect(result.current.error).toBe('Image generation failed');
    expect(result.current.isGenerating).toBe(false);
  });

  it('succeeds even if saveGeneration fails', async () => {
    mockSaveGeneration.mockRejectedValue(new Error('save failed'));
    const { result } = renderHook(() => useGeneration());

    let genResult: unknown;
    await act(async () => {
      genResult = await result.current.generate('prompt', 'square');
    });

    expect(genResult).toBeTruthy();
    expect(result.current.error).toBeNull();
  });

  it('uses fallback dimensions when format not in metadata', async () => {
    mockGenerateAd.mockResolvedValue({
      ...fakeAdSpec,
      metadata: undefined,
    });
    const { result } = renderHook(() => useGeneration());

    await act(async () => {
      await result.current.generate('prompt', 'story');
    });

    expect(mockGenerateImage).toHaveBeenCalledWith(expect.objectContaining({
      width: 1080,
      height: 1920,
    }));
  });

  it('clears error on new generation', async () => {
    mockGenerateAd.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useGeneration());

    await act(async () => {
      await result.current.generate('prompt', 'square');
    });
    expect(result.current.error).toBe('fail');

    mockGenerateAd.mockResolvedValueOnce(fakeAdSpec);
    mockGenerateImage.mockResolvedValueOnce(fakeImgData);
    await act(async () => {
      await result.current.generate('prompt', 'square');
    });
    expect(result.current.error).toBeNull();
  });
});
