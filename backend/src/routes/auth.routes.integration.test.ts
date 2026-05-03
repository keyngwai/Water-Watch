import request from 'supertest';
import app from '../app';
import { AppError } from '../middlewares/error.middleware';
import * as authService from '../services/auth.service';

jest.mock('../services/auth.service', () => ({
  REFRESH_COOKIE_NAME: 'maji_refresh',
  getRefreshCookieOptions: jest.fn(() => ({
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 1209600000,
  })),
  requestPasswordReset: jest.fn(),
  resetPasswordWithToken: jest.fn(),
  registerCitizen: jest.fn(),
  loginUser: jest.fn(),
  getUserById: jest.fn(),
  createAdminUser: jest.fn(),
  rotateRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
}));

describe('Auth routes integration: password reset flow', () => {
  const mockedService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_RESET_URL = 'http://localhost:5173/reset-password';
  });

  it('POST /api/auth/forgot-password returns generic success for valid email', async () => {
    mockedService.requestPasswordReset.mockResolvedValueOnce();

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'citizen@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.requested).toBe(true);
    expect(mockedService.requestPasswordReset).toHaveBeenCalledWith(
      'citizen@example.com',
      'http://localhost:5173/reset-password',
      expect.objectContaining({
        ip_address: expect.any(String),
      })
    );
  });

  it('POST /api/auth/forgot-password rejects invalid email payload', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'invalid-email' });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/auth/reset-password resets password with valid payload', async () => {
    mockedService.resetPasswordWithToken.mockResolvedValueOnce();

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(64), new_password: 'StrongPass1' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.reset).toBe(true);
    expect(mockedService.resetPasswordWithToken).toHaveBeenCalledWith(
      'a'.repeat(64),
      'StrongPass1',
      expect.objectContaining({
        ip_address: expect.any(String),
      })
    );
  });

  it('POST /api/auth/reset-password returns service AppError for bad token', async () => {
    mockedService.resetPasswordWithToken.mockRejectedValueOnce(
      new AppError('Invalid or expired reset token.', 400, 'INVALID_RESET_TOKEN')
    );

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(64), new_password: 'StrongPass1' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('INVALID_RESET_TOKEN');
  });

  it('POST /api/auth/reset-password rejects weak password', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(64), new_password: 'weak' });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('Auth routes integration: refresh session', () => {
  const mockedService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/refresh returns token when rotation succeeds', async () => {
    mockedService.rotateRefreshToken.mockResolvedValueOnce({
      accessToken: 'access.jwt.example',
      newRefreshToken: 'new-refresh-raw',
    });

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'maji_refresh=old-refresh-raw');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBe('access.jwt.example');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('maji_refresh=')])
    );
    expect(mockedService.rotateRefreshToken).toHaveBeenCalledWith('old-refresh-raw');
  });

  it('POST /api/auth/refresh rejects without cookie', async () => {
    const response = await request(app).post('/api/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTH_REFRESH_MISSING');
    expect(mockedService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('POST /api/auth/refresh clears cookie when rotation fails', async () => {
    mockedService.rotateRefreshToken.mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'maji_refresh=bad');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTH_REFRESH_INVALID');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('maji_refresh=')])
    );
  });
});

describe('Auth routes integration: logout', () => {
  const mockedService = authService as jest.Mocked<typeof authService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/logout revokes refresh session', async () => {
    mockedService.revokeRefreshToken.mockResolvedValueOnce();

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'maji_refresh=tok-value');

    expect(response.status).toBe(200);
    expect(response.body.data.loggedOut).toBe(true);
    expect(mockedService.revokeRefreshToken).toHaveBeenCalledWith('tok-value');
  });

  it('POST /api/auth/logout succeeds without cookie', async () => {
    const response = await request(app).post('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(mockedService.revokeRefreshToken).not.toHaveBeenCalled();
  });
});
