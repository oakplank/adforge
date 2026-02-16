import express from 'express';
import cors from 'cors';
import { createGenerateImageRouter } from './generateImage.js';
import { createGenerateAdRouter } from './generateAd.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(createGenerateImageRouter());
app.use(createGenerateAdRouter());

export default app;
