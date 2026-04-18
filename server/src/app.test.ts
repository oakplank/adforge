import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('GET /api/health', () => {
  it('returns { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('API error surface', () => {
  it('returns JSON 404 for unmatched /api routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('returns JSON 400 for malformed JSON bodies', async () => {
    const res = await request(app)
      .post('/api/generate-image')
      .set('Content-Type', 'application/json')
      .send('{"bad json"');
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.error).toBe('Invalid JSON body');
  });
});
