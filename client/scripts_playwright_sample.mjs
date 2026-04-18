import { chromium } from 'playwright';

const prompt = "PartingWord.com end-of-life messaging platform launch, compassionate modern aesthetic, dark green and light cream beige palette, focus on caregivers and family decision-makers, warm natural home scene.";
const outCanvas = '/Users/branch/.openclaw/workspace/adforge/analysis_outputs/full_pipeline_sample_canvas.png';
const outUI = '/Users/branch/.openclaw/workspace/adforge/analysis_outputs/full_pipeline_sample_ui.png';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
page.setDefaultTimeout(240000);

try {
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="prompt-input"]');
  await page.fill('[data-testid="prompt-input"]', prompt);
  await page.click('[data-testid="generate-button"]');

  await page.waitForFunction(() => {
    const spinner = document.querySelector('[data-testid="button-spinner"]');
    const loading = document.querySelector('[data-testid="canvas-loading-overlay"]');
    const btn = document.querySelector('[data-testid="generate-button"]');
    const disabled = btn instanceof HTMLButtonElement ? btn.disabled : false;
    return !spinner && !loading && !disabled;
  }, null, { timeout: 240000 });

  const errNode = page.locator('[data-testid="generation-error"]');
  if (await errNode.count()) {
    const err = (await errNode.textContent())?.trim();
    if (err) {
      throw new Error(`Generation error: ${err}`);
    }
  }

  const canvas = page.locator('[data-testid="fabric-canvas"]');
  await canvas.waitFor();
  await canvas.screenshot({ path: outCanvas });

  await page.screenshot({ path: outUI, fullPage: true });
  console.log(JSON.stringify({ outCanvas, outUI }));
} finally {
  await browser.close();
}
