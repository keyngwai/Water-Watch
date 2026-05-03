import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ForgotPassword from './ForgotPassword';
import { authApi } from '../services/api';

vi.mock('../services/api', () => ({
  authApi: {
    forgotPassword: vi.fn(),
  },
  getApiError: () => 'Request failed',
}));

describe('ForgotPassword page', () => {
  it('submits email and shows success notice', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValueOnce({ requested: true });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'citizen@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith('citizen@example.com');
    });
    expect(screen.getByText(/Check your inbox for the reset link/i)).toBeInTheDocument();
  });
});
