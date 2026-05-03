import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ResetPassword from './ResetPassword';
import { authApi } from '../services/api';

vi.mock('../services/api', () => ({
  authApi: {
    resetPassword: vi.fn(),
  },
  getApiError: () => 'Request failed',
}));

describe('ResetPassword page', () => {
  it('submits new password with token from query string', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValueOnce({ reset: true });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=abc123token']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), { target: { value: 'StrongPass1' } });
    fireEvent.change(screen.getByPlaceholderText('Repeat new password'), { target: { value: 'StrongPass1' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith('abc123token', 'StrongPass1');
    });
  });
});
