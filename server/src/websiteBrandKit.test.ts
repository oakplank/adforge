import { describe, it, expect } from 'vitest';
import { extractWebsiteSignal, extractPaletteFromHtml, extractContextFromHtml } from './websiteBrandKit.js';

describe('extractWebsiteSignal', () => {
  it('detects explicit @domain signal', () => {
    const url = extractWebsiteSignal('launch campaign for @clearpathathletics.com with energetic vibe');
    expect(url).toBe('https://clearpathathletics.com');
  });

  it('detects explicit https URL signal', () => {
    const url = extractWebsiteSignal('please use https://www.partingword.com/ for brand kit');
    expect(url).toBe('https://partingword.com');
  });

  it('detects bare domain mentions too', () => {
    const url = extractWebsiteSignal('partingword.com launch campaign');
    expect(url).toBe('https://partingword.com');
  });
});

describe('extractPaletteFromHtml', () => {
  it('extracts ranked hex colors from markup', () => {
    const html = `
      <div style="background:#071631;color:#63A8FF;border-color:#63A8FF"></div>
      <span style="color:#B3D6F6"></span>
      <div style="background:#071631"></div>
    `;
    const palette = extractPaletteFromHtml(html);

    expect(palette[0]).toBe('#071631');
    expect(palette).toContain('#63A8FF');
    expect(palette).toContain('#B3D6F6');
  });
});

describe('extractContextFromHtml', () => {
  it('extracts summary and key phrases from headings and body text', () => {
    const html = `
      <h1>Train with Purpose</h1>
      <h2>Spring Showcase Registration Open</h2>
      <p>Elite training programs for high school athletes.</p>
      <li>Experienced coaching staff</li>
    `;
    const context = extractContextFromHtml(html);

    expect(context.summary.toLowerCase()).toContain('train with purpose');
    expect(context.keyPhrases.length).toBeGreaterThan(2);
    expect(context.keyPhrases.join(' ').toLowerCase()).toContain('training');
  });

  it('website signal parser strips @ prefix punctuation cleanly', () => {
    const url = extractWebsiteSignal('use @clearpathathletics.com, then generate ad');
    expect(url).toBe('https://clearpathathletics.com');
  });
});
