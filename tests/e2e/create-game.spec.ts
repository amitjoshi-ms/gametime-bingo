import { test, expect } from '@playwright/test';

test.describe('Name Validation', () => {
  test('should not allow empty name when creating game', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: 'Create Game' }).click();
    const dialog = page.locator('dialog[open]');
    
    // Leave name empty and try to create
    const createButton = dialog.getByRole('button', { name: 'Create' });
    await createButton.click();
    
    // Should still be on the create dialog (didn't navigate away)
    await expect(dialog).toBeVisible();
    
    // Dialog should remain visible (validation prevented navigation)
    await expect(dialog).toBeVisible();
  });
});

