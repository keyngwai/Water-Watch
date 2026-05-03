import { AppError } from '../middlewares/error.middleware';
import * as authService from './auth.service';
import { query, queryOne } from '../config/database';

jest.mock('../config/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));

const sendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail })),
}));

describe('auth.service password reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_HOST = '';
    process.env.EMAIL_USER = '';
    process.env.EMAIL_PASS = '';
    process.env.EMAIL_FROM = 'no-reply@test.local';
  });

  it('silently accepts forgot-password for unknown email', async () => {
    (queryOne as jest.Mock).mockResolvedValueOnce(null);
    (query as jest.Mock).mockResolvedValue([]);

    await expect(
      authService.requestPasswordReset('unknown@example.com', 'http://localhost:5173/reset-password')
    ).resolves.toBeUndefined();

    expect(query).toHaveBeenCalled();
  });

  it('marks reset token as used and updates password', async () => {
    (queryOne as jest.Mock).mockResolvedValueOnce({
      id: 15,
      user_id: 'user-1',
      token: 'token-123',
      expires_at: new Date(Date.now() + 60_000),
      used: false,
    });
    (query as jest.Mock).mockResolvedValue([]);

    await authService.resetPasswordWithToken('token-123', 'StrongPass1');

    expect(query).toHaveBeenCalledWith('BEGIN');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET password_hash = $1'), [
      expect.any(String),
      'user-1',
    ]);
    expect(query).toHaveBeenCalledWith('COMMIT');
  });

  it('rejects invalid reset token', async () => {
    (queryOne as jest.Mock).mockResolvedValueOnce(null);
    (query as jest.Mock).mockResolvedValue([]);

    await expect(authService.resetPasswordWithToken('bad-token', 'StrongPass1')).rejects.toBeInstanceOf(AppError);
    expect(query).not.toHaveBeenCalledWith('COMMIT');
  });
});
