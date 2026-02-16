import { Router, Request, Response } from 'express';
import { GenerationsStore } from './generationsStore.js';

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function createGenerationsRouter(store?: GenerationsStore): Router {
  const router = Router();
  const generationsStore = store ?? new GenerationsStore();

  router.get('/api/generations', async (req: Request, res: Response) => {
    try {
      const limit = toPositiveInt(req.query.limit, 40);
      const generations = await generationsStore.list(limit);
      res.json({ generations });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to list generations';
      res.status(500).json({ error: message });
    }
  });

  router.post('/api/generations', async (req: Request, res: Response) => {
    const {
      prompt,
      format,
      width,
      height,
      imagePrompt,
      enhancedPrompt,
      systemPrompt,
      model,
      adSpec,
      imageBase64,
      imageUrl,
      mimeType,
    } = req.body ?? {};

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid prompt' });
      return;
    }

    if (!format || typeof format !== 'string' || format.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid format' });
      return;
    }

    if (!imagePrompt || typeof imagePrompt !== 'string' || imagePrompt.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid imagePrompt' });
      return;
    }

    if (!adSpec || typeof adSpec !== 'object') {
      res.status(400).json({ error: 'Missing or invalid adSpec' });
      return;
    }

    if (!imageBase64 && !imageUrl) {
      res.status(400).json({ error: 'Missing image payload' });
      return;
    }

    try {
      const generation = await generationsStore.save({
        prompt: prompt.trim(),
        format: format.trim(),
        width: typeof width === 'number' ? width : undefined,
        height: typeof height === 'number' ? height : undefined,
        imagePrompt: imagePrompt.trim(),
        enhancedPrompt: typeof enhancedPrompt === 'string' ? enhancedPrompt.trim() : undefined,
        systemPrompt: typeof systemPrompt === 'string' ? systemPrompt.trim() : undefined,
        model: typeof model === 'string' ? model.trim() : undefined,
        adSpec,
        imageBase64: typeof imageBase64 === 'string' ? imageBase64 : undefined,
        imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
        mimeType: typeof mimeType === 'string' ? mimeType : undefined,
      });
      res.status(201).json({ generation });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save generation';
      res.status(500).json({ error: message });
    }
  });

  router.get('/api/generations/:id/image', async (req: Request, res: Response) => {
    try {
      const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const image = await generationsStore.resolveImagePath(idParam);
      if (!image) {
        res.status(404).json({ error: 'Generation image not found' });
        return;
      }

      res.type(image.mimeType);
      res.sendFile(image.filePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load generation image';
      res.status(500).json({ error: message });
    }
  });

  return router;
}
