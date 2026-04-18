import { describe, it, expect } from 'vitest';
import {
  detectCategory,
  detectObjective,
  getFormatConfig,
  generateTextSafeZoneInstructions,
  generateEnhancedPrompt,
  buildPromptPipeline,
  enhanceImagePrompt,
  FORMAT_CONFIGS,
  CATEGORY_CONFIGS,
} from './promptEngine.js';

describe('detectCategory', () => {
  it('detects food category', () => {
    expect(detectCategory('pizza', 'delicious pizza deal')).toBe('food');
    expect(detectCategory('coffee', 'morning coffee sale')).toBe('food');
  });

  it('detects fashion category', () => {
    expect(detectCategory('dress', 'summer dress collection')).toBe('fashion');
    expect(detectCategory('sneakers', 'new sneakers drop')).toBe('fashion');
  });

  it('detects tech category', () => {
    expect(detectCategory('laptop', 'new laptop deal')).toBe('tech');
    expect(detectCategory('headphones', 'wireless headphones')).toBe('tech');
  });

  it('returns general for unknown products', () => {
    expect(detectCategory('widget', 'amazing widget')).toBe('general');
  });

  it('does not misclassify "spring" as jewelry "ring"', () => {
    expect(detectCategory('spring showcase registration', 'athletics training camp')).not.toBe('jewelry');
  });
});

describe('detectObjective', () => {
  it('detects offer objective', () => {
    expect(detectObjective('30% off all sneakers')).toBe('offer');
  });

  it('detects launch objective', () => {
    expect(detectObjective('Introducing our new matte sunscreen')).toBe('launch');
  });

  it('defaults to awareness objective', () => {
    expect(detectObjective('Premium cookware for everyday kitchens')).toBe('awareness');
  });

  it('does not treat words like "offers" as discount intent', () => {
    expect(detectObjective('This platform offers elite coaching for athletes')).toBe('awareness');
  });
});

describe('getFormatConfig', () => {
  it('returns square config for square format', () => {
    const config = getFormatConfig('square');
    expect(config.aspectRatio).toBe('1:1');
    expect(config.width).toBe(1080);
    expect(config.height).toBe(1080);
  });

  it('returns portrait config for portrait format', () => {
    const config = getFormatConfig('portrait');
    expect(config.aspectRatio).toBe('4:5');
    expect(config.width).toBe(1080);
    expect(config.height).toBe(1350);
  });

  it('returns story config for story format', () => {
    const config = getFormatConfig('story');
    expect(config.aspectRatio).toBe('9:16');
    expect(config.width).toBe(1080);
    expect(config.height).toBe(1920);
  });

  it('defaults to square for unknown formats', () => {
    const config = getFormatConfig('unknown');
    expect(config.aspectRatio).toBe('1:1');
  });
});

describe('generateTextSafeZoneInstructions', () => {
  it('includes top and bottom percentages with overlay guidance', () => {
    const config = FORMAT_CONFIGS.square;
    const instructions = generateTextSafeZoneInstructions(config);

    expect(instructions).toContain('top');
    expect(instructions).toContain('bottom');
    expect(instructions).toContain('clean');
    expect(instructions).toContain('overlays');
  });
});

describe('generateEnhancedPrompt', () => {
  it('returns prompt payload with detected category and format config', () => {
    const result = generateEnhancedPrompt('pizza', 'delicious pizza', 'warm', 'square');

    expect(result.prompt).toBeTruthy();
    expect(result.prompt.toLowerCase()).toContain('instagram');
    expect(result.category).toBe('food');
    expect(result.formatConfig.aspectRatio).toBe('1:1');
  });

  it('includes safe-zone guidance in render prompt output', () => {
    const result = generateEnhancedPrompt('watch', 'luxury watch', 'luxury', 'portrait');
    expect(result.prompt.toLowerCase()).toContain('top');
    expect(result.prompt.toLowerCase()).toContain('bottom');
  });
});

describe('buildPromptPipeline', () => {
  it('builds strategy metadata for offer prompts', () => {
    const result = buildPromptPipeline({
      rawPrompt: 'Flash sale 30% off running shoes for commuters',
      product: 'running shoes',
      description: 'Flash sale 30% off running shoes for commuters',
      vibe: 'energetic',
      format: 'portrait',
      offer: '30% off',
    });

    expect(result.objective).toBe('offer');
    expect(result.promptPipeline.baseCreativeBrief).toContain('Goal: offer');
    expect(result.promptPipeline.renderPrompt).toContain('Instagram');
    expect(result.promptPipeline.systemPrompt).toContain('creative director');
    expect(result.promptPipeline.renderPrompt).toContain('Composition strategy');
    expect(result.promptPipeline.qualityChecklist.length).toBeGreaterThan(2);
    expect(result.placementHints.ctaPriority).toBe('high');
    expect(result.suggestedTemplateId).toBe('bold-sale');
  });

  it('builds launch strategy metadata for new-product prompts', () => {
    const result = buildPromptPipeline({
      rawPrompt: 'Introducing our new skincare serum for sensitive skin',
      product: 'skincare serum',
      description: 'Introducing our new skincare serum for sensitive skin',
      vibe: 'calm',
      format: 'square',
    });

    expect(result.objective).toBe('launch');
    expect(result.agenticPlan.preflightChecklist.length).toBeGreaterThan(0);
    expect(result.agenticPlan.postImageChecklist.length).toBeGreaterThan(0);
  });

  it('applies PartingWord brand context, palette, and adaptive lane placement guidance', () => {
    const result = buildPromptPipeline({
      rawPrompt: 'PartingWord.com end of life messaging platform, calm trustworthy tone',
      product: 'end of life messaging platform',
      description: 'PartingWord.com end of life messaging platform, calm trustworthy tone',
      vibe: 'calm',
      format: 'portrait',
    });

    expect(result.promptPipeline.baseCreativeBrief).toContain('PartingWord');
    expect(result.promptPipeline.renderPrompt).toContain('https://www.partingword.com/');
    expect(result.promptPipeline.renderPrompt).toContain('#1E4D3A');
    expect(result.promptPipeline.renderPrompt).toContain('#F1E9DA');
    expect(result.promptPipeline.systemPrompt).toContain('empathetic');
    expect(result.placementHints.preferredAlignment).toBe('auto');
    expect(result.placementHints.avoidCenter).toBe(true);
    expect(result.suggestedTemplateId).toBe('minimal');
    expect(result.promptPipeline.renderPrompt).toContain('outer 30-40%');
    expect(result.promptPipeline.renderPrompt).toContain('left or right');
    expect(result.promptPipeline.renderPrompt).toContain('Do not render tablets, phones, laptops');
    expect(result.promptPipeline.renderPrompt).toContain('Do not fabricate gradient rows, columns');
    expect(result.promptPipeline.renderPrompt).toContain('one primary anchor object');
    expect(result.promptPipeline.systemPrompt).toContain('narrative logic');
    expect(result.promptPipeline.systemPrompt).toContain('silent pre-render thought session');
    expect(result.promptPipeline.interpretiveLayer.selectedDirection).toBeTruthy();
    expect(result.promptPipeline.interpretiveLayer.refinedSceneInstruction).toBeTruthy();
    expect(result.promptPipeline.thoughtSession.targetAudience).toBeTruthy();
    expect(result.promptPipeline.thoughtSession.humanPresence).toBeTruthy();
    expect(result.promptPipeline.renderPrompt).toContain('Pre-render thought session');
    expect(result.promptPipeline.renderPrompt).toContain('Human presence policy');
    expect(result.promptPipeline.renderPrompt).toContain('Regenerate instead of forcing output');
    expect(result.promptPipeline.renderPrompt).toContain('sterile isolated object-on-white-background');
    expect(result.promptPipeline.renderPrompt).toContain('Interpretive direction selected');
  });
});

describe('enhanceImagePrompt', () => {
  it('returns complete enhanced prompt output', () => {
    const result = enhanceImagePrompt({
      product: 'coffee',
      category: 'food',
      vibe: 'warm',
      format: 'square',
    });

    expect(result.prompt).toBeTruthy();
    expect(result.category).toBe('food');
    expect(result.formatConfig).toBeDefined();
    expect(result.textSafeZoneInstructions).toBeDefined();
    expect(result.photographyDirections).toContain('Lighting');
  });
});

describe('FORMAT_CONFIGS', () => {
  it('has all required formats', () => {
    expect(FORMAT_CONFIGS.square).toBeDefined();
    expect(FORMAT_CONFIGS.portrait).toBeDefined();
    expect(FORMAT_CONFIGS.story).toBeDefined();
  });

  it('has safe zone values for each format', () => {
    for (const format of Object.values(FORMAT_CONFIGS)) {
      expect(format.safeZoneTop).toBeGreaterThan(0);
      expect(format.safeZoneBottom).toBeGreaterThan(0);
    }
  });
});

describe('CATEGORY_CONFIGS', () => {
  it('has all required categories', () => {
    const requiredCategories = ['food', 'fashion', 'tech', 'beauty', 'fitness', 'travel', 'home', 'automotive', 'jewelry', 'general'];
    for (const category of requiredCategories) {
      expect(CATEGORY_CONFIGS[category as keyof typeof CATEGORY_CONFIGS]).toBeDefined();
    }
  });

  it('has photography style fields for each category', () => {
    for (const config of Object.values(CATEGORY_CONFIGS)) {
      expect(config.photographyStyle).toBeTruthy();
      expect(config.lightingStyle).toBeTruthy();
      expect(config.backgroundStyle).toBeTruthy();
    }
  });
});
