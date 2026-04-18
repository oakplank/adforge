import { describe, it, expect } from 'vitest';
import { SAMPLE_PROMPTS, getPromptsByCategory, getCategories } from './samplePrompts';

describe('Sample Prompts', () => {
  it('has at least 5 sample prompts', () => {
    expect(SAMPLE_PROMPTS.length).toBeGreaterThanOrEqual(5);
  });

  it('each prompt has required fields', () => {
    for (const prompt of SAMPLE_PROMPTS) {
      expect(prompt.id).toBeTruthy();
      expect(prompt.prompt).toBeTruthy();
      expect(prompt.category).toBeTruthy();
      expect(prompt.description).toBeTruthy();
    }
  });

  it('prompts have unique IDs', () => {
    const ids = SAMPLE_PROMPTS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('prompts contain useful information for ad generation', () => {
    for (const prompt of SAMPLE_PROMPTS) {
      // Each prompt should have reasonable length
      expect(prompt.prompt.length).toBeGreaterThan(10);
      // Description should be informative
      expect(prompt.description.length).toBeGreaterThan(5);
    }
  });
});

describe('getPromptsByCategory', () => {
  it('returns prompts matching category', () => {
    const salePrompts = getPromptsByCategory('Sale');
    expect(salePrompts.length).toBeGreaterThan(0);
    for (const prompt of salePrompts) {
      expect(prompt.category).toBe('Sale');
    }
  });

  it('returns empty array for unknown category', () => {
    const result = getPromptsByCategory('NonExistentCategory');
    expect(result).toEqual([]);
  });
});

describe('getCategories', () => {
  it('returns unique categories', () => {
    const categories = getCategories();
    expect(categories.length).toBeGreaterThan(0);
    const uniqueCategories = new Set(categories);
    expect(uniqueCategories.size).toBe(categories.length);
  });

  it('includes common categories', () => {
    const categories = getCategories();
    expect(categories).toContain('Sale');
  });
});
