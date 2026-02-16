import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import { createGenerationsRouter } from './generations.js';
import { GenerationsStore } from './generationsStore.js';

async function createTestApp() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'adforge-generations-'));
  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use(createGenerationsRouter(new GenerationsStore(tempDir)));
  return { app, tempDir };
}

describe('Generations API', () => {
  it('persists generation and lists it with image endpoint', async () => {
    const { app } = await createTestApp();

    const base64 = Buffer.from('image-bytes').toString('base64');
    const payload = {
      prompt: 'PartingWord launch ad',
      format: 'square',
      width: 1080,
      height: 1080,
      imagePrompt: 'Refined image prompt text',
      enhancedPrompt: 'Enhanced rendering prompt',
      systemPrompt: 'System prompt',
      model: 'gemini-3-pro-image-preview',
      adSpec: {
        imagePrompt: 'brief',
        texts: { headline: 'H', subhead: 'S', cta: 'C' },
        colors: { primary: '#111', secondary: '#222', accent: '#333', text: '#fff', background: '#000' },
        templateId: 'bold-sale',
      },
      imageBase64: base64,
      mimeType: 'image/png',
    };

    const saveRes = await request(app).post('/api/generations').send(payload);
    expect(saveRes.status).toBe(201);
    expect(saveRes.body.generation.prompt).toBe(payload.prompt);
    expect(saveRes.body.generation.imageUrl).toMatch(/^\/api\/generations\/.+\/image$/);

    const listRes = await request(app).get('/api/generations');
    expect(listRes.status).toBe(200);
    expect(listRes.body.generations).toHaveLength(1);
    expect(listRes.body.generations[0].prompt).toBe(payload.prompt);
    expect(listRes.body.generations[0].imagePrompt).toBe(payload.imagePrompt);

    const imagePath = listRes.body.generations[0].imageUrl as string;
    const imageRes = await request(app).get(imagePath);
    expect(imageRes.status).toBe(200);
    expect(imageRes.headers['content-type']).toContain('image/png');
  });

  it('returns 400 when required fields are missing', async () => {
    const { app } = await createTestApp();

    const res = await request(app).post('/api/generations').send({ prompt: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('format');
  });

  it('stores external image URLs when base64 is absent', async () => {
    const { app } = await createTestApp();

    const saveRes = await request(app).post('/api/generations').send({
      prompt: 'Remote image case',
      format: 'portrait',
      imagePrompt: 'Prompt',
      adSpec: { templateId: 'bold-sale' },
      imageUrl: 'https://example.com/image.png',
    });

    expect(saveRes.status).toBe(201);
    expect(saveRes.body.generation.imageUrl).toBe('https://example.com/image.png');
  });
});
