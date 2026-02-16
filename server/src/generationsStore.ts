import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_LIMIT = 40;

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

function resolveGenerationsDir(): string {
  const configuredDir = process.env.ADFORGE_GENERATIONS_DIR?.trim();
  if (configuredDir) {
    return path.resolve(configuredDir);
  }
  return path.resolve(process.cwd(), 'generations');
}

function mapMimeToExtension(mimeType: string): string {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/webp') return '.webp';
  return '.png';
}

function sanitizeId(id: string): string | null {
  return /^[a-zA-Z0-9_-]+$/.test(id) ? id : null;
}

function makeGenerationId(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function ensureDirExists(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export interface GenerationSaveInput {
  prompt: string;
  format: string;
  width?: number;
  height?: number;
  imagePrompt: string;
  enhancedPrompt?: string;
  systemPrompt?: string;
  model?: string;
  adSpec: unknown;
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
}

interface StoredGeneration {
  id: string;
  createdAt: string;
  prompt: string;
  format: string;
  width?: number;
  height?: number;
  imagePrompt: string;
  enhancedPrompt?: string;
  systemPrompt?: string;
  model?: string;
  adSpec: unknown;
  image: {
    kind: 'local' | 'remote';
    mimeType?: string;
    fileName?: string;
    url?: string;
  };
}

export interface GenerationRecord {
  id: string;
  createdAt: string;
  prompt: string;
  format: string;
  width?: number;
  height?: number;
  imagePrompt: string;
  enhancedPrompt?: string;
  systemPrompt?: string;
  model?: string;
  adSpec: unknown;
  imageUrl: string;
  mimeType?: string;
}

export class GenerationsStore {
  private readonly baseDir?: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ? path.resolve(baseDir) : undefined;
  }

  private getDir(): string {
    return this.baseDir ?? resolveGenerationsDir();
  }

  private async jsonPathFor(id: string): Promise<string> {
    const safeId = sanitizeId(id);
    if (!safeId) {
      throw new Error('Invalid generation id');
    }
    const dir = this.getDir();
    await ensureDirExists(dir);
    return path.join(dir, `${safeId}.json`);
  }

  private toRecordOutput(entry: StoredGeneration): GenerationRecord {
    const imageUrl = entry.image.kind === 'local'
      ? `/api/generations/${entry.id}/image`
      : (entry.image.url ?? '');

    return {
      id: entry.id,
      createdAt: entry.createdAt,
      prompt: entry.prompt,
      format: entry.format,
      width: entry.width,
      height: entry.height,
      imagePrompt: entry.imagePrompt,
      enhancedPrompt: entry.enhancedPrompt,
      systemPrompt: entry.systemPrompt,
      model: entry.model,
      adSpec: entry.adSpec,
      imageUrl,
      mimeType: entry.image.mimeType,
    };
  }

  async save(input: GenerationSaveInput): Promise<GenerationRecord> {
    const dir = this.getDir();
    await ensureDirExists(dir);

    const id = makeGenerationId();
    const createdAt = new Date().toISOString();

    let image: StoredGeneration['image'];

    if (input.imageBase64) {
      const mimeType = input.mimeType && ALLOWED_MIME_TYPES.has(input.mimeType)
        ? input.mimeType
        : 'image/png';
      const extension = mapMimeToExtension(mimeType);
      const fileName = `${id}${extension}`;
      const filePath = path.join(dir, fileName);
      const imageBuffer = Buffer.from(input.imageBase64, 'base64');
      await fs.writeFile(filePath, imageBuffer);
      image = {
        kind: 'local',
        mimeType,
        fileName,
      };
    } else if (input.imageUrl) {
      image = {
        kind: 'remote',
        url: input.imageUrl,
      };
    } else {
      throw new Error('Missing image data');
    }

    const entry: StoredGeneration = {
      id,
      createdAt,
      prompt: input.prompt,
      format: input.format,
      width: input.width,
      height: input.height,
      imagePrompt: input.imagePrompt,
      enhancedPrompt: input.enhancedPrompt,
      systemPrompt: input.systemPrompt,
      model: input.model,
      adSpec: input.adSpec,
      image,
    };

    const jsonPath = await this.jsonPathFor(id);
    await fs.writeFile(jsonPath, JSON.stringify(entry, null, 2), 'utf8');

    return this.toRecordOutput(entry);
  }

  async list(limit = DEFAULT_LIMIT): Promise<GenerationRecord[]> {
    const dir = this.getDir();
    await ensureDirExists(dir);

    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    const entries = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const raw = await fs.readFile(path.join(dir, file), 'utf8');
          const parsed = JSON.parse(raw) as StoredGeneration;
          return parsed;
        } catch {
          return null;
        }
      })
    );

    return entries
      .filter((entry): entry is StoredGeneration => entry !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.max(1, limit))
      .map((entry) => this.toRecordOutput(entry));
  }

  async resolveImagePath(id: string): Promise<{ filePath: string; mimeType: string } | null> {
    const jsonPath = await this.jsonPathFor(id);

    let entry: StoredGeneration;
    try {
      const raw = await fs.readFile(jsonPath, 'utf8');
      entry = JSON.parse(raw) as StoredGeneration;
    } catch {
      return null;
    }

    if (entry.image.kind !== 'local' || !entry.image.fileName) {
      return null;
    }

    const filePath = path.join(this.getDir(), entry.image.fileName);
    try {
      await fs.access(filePath);
      return {
        filePath,
        mimeType: entry.image.mimeType || 'image/png',
      };
    } catch {
      return null;
    }
  }
}
