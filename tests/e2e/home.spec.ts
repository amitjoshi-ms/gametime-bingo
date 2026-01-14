/**
 * End-to-end tests for BINGO game home page
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the game title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('BINGO');
  });

  test('should show create and join buttons', async ({ page }) => {
    await page.goto('/');
    
    // Look for Create Game button
    const createButton = page.getByRole('button', { name: 'Create Game' });
    await expect(createButton).toBeVisible();
    
    // Look for Join Game button
    const joinButton = page.getByRole('button', { name: 'Join Game' });
    await expect(joinButton).toBeVisible();
  });

  test('should show subtitle', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Multiplayer Party Game')).toBeVisible();
  });
});

test.describe('Create Game Modal', () => {
  test('should open create modal when clicking Create Game', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: 'Create Game' }).click();
    
    // Modal title should be visible - use the dialog heading
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Create Game')).toBeVisible();
  });

  test('should accept player name and show create button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Game' }).click();
    
    // Get the open dialog
    const dialog = page.locator('dialog[open]');
    
    // Fill in name using the input within the open dialog
    const nameInput = dialog.getByPlaceholder('Enter your name');
    await nameInput.fill('TestHost');
    await expect(nameInput).toHaveValue('TestHost');
    
    // Create button should be visible in the dialog
    await expect(dialog.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('should close modal when clicking Cancel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Game' }).click();
    
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    
    // Click cancel
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    
    // Dialog should close
    await expect(dialog).not.toBeVisible();
  });
});

test.describe('Join Game Modal', () => {
  test('should open join modal when clicking Join Game', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: 'Join Game' }).click();
    
    // Dialog should be visible
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Join Game')).toBeVisible();
  });

  test('should have room code and name inputs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Join Game' }).click();
    
    const dialog = page.locator('dialog[open]');
    
    // Should have room code input
    await expect(dialog.getByPlaceholder('ABC123')).toBeVisible();
    // Should have name input
    await expect(dialog.getByPlaceholder('Enter your name')).toBeVisible();
  });

  test('should accept room code and player name', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Join Game' }).click();
    
    const dialog = page.locator('dialog[open]');
    
    // Fill in room code
    const codeInput = dialog.getByPlaceholder('ABC123');
    await codeInput.fill('TEST99');
    await expect(codeInput).toHaveValue('TEST99');
    
    // Fill in name
    const nameInput = dialog.getByPlaceholder('Enter your name');
    await nameInput.fill('TestPlayer');
    await expect(nameInput).toHaveValue('TestPlayer');
  });

  test('should have join button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Join Game' }).click();
    
    const dialog = page.locator('dialog[open]');
    
    // Join button should be visible in the dialog footer
    await expect(dialog.getByRole('button', { name: 'Join' })).toBeVisible();
  });
});
