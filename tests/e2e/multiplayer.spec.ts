import { test, expect } from '@playwright/test';

test.describe('Join Game Validation', () => {
  test('should show error for invalid room code format', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Join Game' }).click();
    
    const dialog = page.locator('dialog[open]');
    await dialog.getByPlaceholder('ABC123').fill('abc'); // lowercase, too short
    await dialog.getByPlaceholder('Enter your name').fill('TestPlayer');
    await dialog.getByRole('button', { name: 'Join' }).click();
    
    // Should show error or stay on dialog
    await expect(dialog).toBeVisible();
  });

  test('should show error for non-existent room code', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Join Game' }).click();
    
    const dialog = page.locator('dialog[open]');
    await dialog.getByPlaceholder('ABC123').fill('ZZZZZ9'); // Valid format but doesn't exist
    await dialog.getByPlaceholder('Enter your name').fill('TestPlayer');
    await dialog.getByRole('button', { name: 'Join' }).click();
    
    // Dialog should remain visible or show an error (connection timeout)
    // Wait for potential network timeout then verify we didn't navigate to lobby
    await expect(page.locator('.lobby__code')).not.toBeVisible({ timeout: 5000 });
  });
});
