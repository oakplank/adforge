import express from 'express';
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

export default app;
