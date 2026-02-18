import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createGenerateImageRouter } from './generateImage.js';
import { createGenerateAdRouter } from './generateAd.js';
import { createGenerationsRouter } from './generations.js';

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3001')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(createGenerateImageRouter());
app.use(createGenerateAdRouter());
app.use(createGenerationsRouter());

export default app;
