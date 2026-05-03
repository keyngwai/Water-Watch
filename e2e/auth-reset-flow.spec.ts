import { expect, test } from '@playwright/test';

test('forgot password page loads and submits email field', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible();
  await page.getByPlaceholder('you@example.com').fill('citizen@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText(/If the email exists, a reset link has been sent/i)).toBeVisible();
  await page.screenshot({ path: 'test-results/evidence-forgot-password.png', fullPage: true });
});
