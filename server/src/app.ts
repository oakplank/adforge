import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { createGenerateImageRouter } from './generateImage.js';
import { createGenerateAdRouter } from './generateAd.js';
import { createGenerationsRouter } from './generations.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(createGenerateImageRouter());
app.use(createGenerateAdRouter());
app.use(createGenerationsRouter());

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// JSON-shaped error handler so body-parser failures (malformed JSON, payload
// too large) don't surface as Express's default HTML error page.
app.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  const status = typeof err.status === 'number' ? err.status : 500;
  const message = err.type === 'entity.too.large'
    ? 'Request body exceeds maximum size'
    : err.type === 'entity.parse.failed'
      ? 'Invalid JSON body'
      : (err.message || 'Internal server error');
  res.status(status).json({ error: message });
});

export default app;
