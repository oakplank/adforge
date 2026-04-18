import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DOCS_PATH = resolve(__dirname, '../../docs/research-findings.md');

describe('Research Findings Document', () => {
  let content: string;

  beforeAll(() => {
    content = readFileSync(DOCS_PATH, 'utf-8');
  });

  it('should exist and be non-empty', () => {
    expect(content.length).toBeGreaterThan(0);
  });

  const requiredSections = [
    'Text Style',
    'Placement Hierarchy',
    'CTA Strategy',
    'Branding',
    'Safe Zones',
    'Do/Donts',
  ];

  for (const section of requiredSections) {
    it(`should contain section: ${section}`, () => {
      const regex = new RegExp(`^##\\s+${section.replace('/', '\\/')}`, 'm');
      expect(content).toMatch(regex);
    });
  }

  for (const section of requiredSections) {
    it(`section "${section}" should contain at least 3 actionable rules (numbered items)`, () => {
      // Extract section content between this heading and the next ## heading
      const escapedSection = section.replace('/', '\\/');
      const headingIndex = content.search(new RegExp(`## ${escapedSection}`));
      expect(headingIndex).toBeGreaterThanOrEqual(0);
      const afterHeading = content.slice(headingIndex);
      const nextHeadingMatch = afterHeading.slice(3).search(/\n## /);
      const sectionContent = nextHeadingMatch >= 0
        ? afterHeading.slice(0, nextHeadingMatch + 3)
        : afterHeading;
      // Count numbered list items (bold numbered items like "1. **...")
      const numberedItems = sectionContent.match(/\d+\.\s+\*\*/g) || [];
      expect(numberedItems.length).toBeGreaterThanOrEqual(3);
    });
  }

  it('should mention the 20% text rule', () => {
    expect(content).toContain('20%');
  });

  it('should document minimum font sizes (24px headline, 14px body)', () => {
    expect(content).toContain('24px');
    expect(content).toContain('14px');
  });

  it('should document safe zone percentages for stories', () => {
    expect(content).toContain('14%');
    expect(content).toContain('35%');
  });
});
