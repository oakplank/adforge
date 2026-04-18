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

  it('returns newest generations first and honors the limit query', async () => {
    const { app } = await createTestApp();

    const base64 = Buffer.from('image-bytes').toString('base64');
    const baseAdSpec = { templateId: 'bold-sale' };

    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/generations').send({
        prompt: `prompt-${i}`,
        format: 'square',
        imagePrompt: `imagePrompt-${i}`,
        adSpec: baseAdSpec,
        imageBase64: base64,
        mimeType: 'image/png',
      });
      expect(res.status).toBe(201);
      // Ensure filename-embedded timestamps differ so ordering is deterministic.
      await new Promise((r) => setTimeout(r, 3));
    }

    const listRes = await request(app).get('/api/generations?limit=3');
    expect(listRes.status).toBe(200);
    expect(listRes.body.generations).toHaveLength(3);
    expect(listRes.body.generations.map((g: { prompt: string }) => g.prompt)).toEqual([
      'prompt-4',
      'prompt-3',
      'prompt-2',
    ]);
  });

  it('rejects imageBase64 containing non-base64 characters', async () => {
    const { app } = await createTestApp();

    const res = await request(app).post('/api/generations').send({
      prompt: 'bad b64',
      format: 'square',
      imagePrompt: 'prompt',
      adSpec: { templateId: 'bold-sale' },
      imageBase64: 'not!!valid$$$base64',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('imageBase64');
  });

  it('rejects imageUrl with a non-http(s) scheme', async () => {
    const { app } = await createTestApp();

    const res = await request(app).post('/api/generations').send({
      prompt: 'bad url',
      format: 'square',
      imagePrompt: 'prompt',
      adSpec: { templateId: 'bold-sale' },
      imageUrl: 'javascript:alert(1)',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('http');
  });

  it('rejects image lookup when stored fileName escapes the generations dir', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'adforge-traversal-'));
    const store = new GenerationsStore(tempDir);

    // Forge a JSON record whose fileName points outside the dir.
    const id = 'gen-forged';
    const forged = {
      id,
      createdAt: new Date().toISOString(),
      prompt: 'x',
      format: 'square',
      imagePrompt: 'x',
      adSpec: {},
      image: { kind: 'local', mimeType: 'image/png', fileName: '../escape.png' },
    };
    await fs.writeFile(path.join(tempDir, `${id}.json`), JSON.stringify(forged), 'utf8');
    // Create the target so the access check would otherwise succeed.
    await fs.writeFile(path.join(tempDir, '..', 'escape.png'), 'nope');

    const result = await store.resolveImagePath(id);
    expect(result).toBeNull();
  });
});
