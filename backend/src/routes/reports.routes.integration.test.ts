import request from 'supertest';
import app from '../app';

describe('Reports routes integration', () => {
  it('GET /api/reports rejects invalid pagination params', async () => {
    const response = await request(app).get('/api/reports?page=0&limit=101');
    expect(response.status).toBe(422);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/reports/admin/stats requires auth', async () => {
    const response = await request(app).get('/api/reports/admin/stats');
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTH_MISSING');
  });

  it('GET /api/reports/admin/export.csv requires auth', async () => {
    const response = await request(app).get('/api/reports/admin/export.csv');
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTH_MISSING');
  });
});
