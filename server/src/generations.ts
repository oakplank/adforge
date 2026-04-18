import { Router, Request, Response } from 'express';
import { GenerationsStore } from './generationsStore.js';

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const BASE64_SHAPE = /^[A-Za-z0-9+/]+={0,2}$/;

// Reject anything that isn't plausibly base64, and anything whose decoded
// size would exceed our on-disk ceiling. Buffer.from silently drops invalid
// chars, so we have to screen the input ourselves.
function validateBase64Image(value: string): { ok: true } | { ok: false; error: string } {
  if (value.length === 0) return { ok: false, error: 'imageBase64 is empty' };
  if (value.length % 4 !== 0) return { ok: false, error: 'imageBase64 is malformed' };
  if (!BASE64_SHAPE.test(value)) return { ok: false, error: 'imageBase64 contains non-base64 characters' };

  // 4 base64 chars encode 3 bytes; subtract padding.
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const decodedBytes = (value.length / 4) * 3 - padding;
  if (decodedBytes > MAX_IMAGE_BYTES) {
    return { ok: false, error: `imageBase64 exceeds ${MAX_IMAGE_BYTES} bytes` };
  }
  return { ok: true };
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

    if (imageBase64 !== undefined && typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'imageBase64 must be a string' });
      return;
    }

    if (typeof imageBase64 === 'string') {
      const check = validateBase64Image(imageBase64);
      if (!check.ok) {
        res.status(400).json({ error: check.error });
        return;
      }
    }

    if (!imageBase64 && typeof imageUrl === 'string' && !isSafeHttpUrl(imageUrl)) {
      res.status(400).json({ error: 'imageUrl must be an http(s) URL' });
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

      // dotfiles: 'allow' so paths containing hidden directories (e.g. .claude
      // worktrees) aren't blocked by send's default dotfile policy.
      res.type(image.mimeType);
      res.sendFile(image.filePath, { dotfiles: 'allow' }, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({ error: 'Failed to stream generation image' });
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load generation image';
      res.status(500).json({ error: message });
    }
  });

  return router;
}
