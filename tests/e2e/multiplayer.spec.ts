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

  test('should navigate to lobby when joining with valid room code format', async ({ page }) => {
    // Note: With P2P/WebRTC, there's no server-side room validation.
    // Joining a "room" connects to a signaling topic. If no host exists,
    // the player will wait in the lobby until connection times out.
    await page.goto('/');
    await page.getByRole('button', { name: 'Join Game' }).click();
    
    const dialog = page.locator('dialog[open]');
    await dialog.getByPlaceholder('ABC123').fill('ZZZZZ9'); // Valid format
    await dialog.getByPlaceholder('Enter your name').fill('TestPlayer');
    await dialog.getByRole('button', { name: 'Join' }).click();
    
    // Should navigate to lobby (P2P room connection is initiated)
    await expect(page.locator('.lobby__code')).toBeVisible({ timeout: 5000 });
  });
});
