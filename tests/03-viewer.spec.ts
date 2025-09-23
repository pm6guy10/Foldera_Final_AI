import { test, expect } from '@playwright/test';

test.describe('Document Viewer Tests', () => {
  test('should display document content in viewer', async ({ page }) => {
    // Assuming document with ID 1 exists
    await page.goto('/document/1');
    
    // Check viewer elements
    await expect(page.locator('[data-testid="viewer-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="document-content"]')).toBeVisible();
    
    // Verify content is displayed
    const content = await page.locator('[data-testid="document-content"]').textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should have copy-to-clipboard functionality', async ({ page }) => {
    await page.goto('/document/1');
    
    // Check for copy button
    await expect(page.locator('[data-testid="button-copy-content"]')).toBeVisible();
    
    // Click copy button
    await page.locator('[data-testid="button-copy-content"]').click();
    
    // Verify copy success feedback
    await expect(page.locator('[data-testid="copy-success-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle non-existent document gracefully', async ({ page }) => {
    await page.goto('/document/99999');
    
    // Should show error or redirect
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should display document metadata in viewer', async ({ page }) => {
    await page.goto('/document/1');
    
    // Check metadata display
    await expect(page.locator('[data-testid="metadata-filename"]')).toBeVisible();
    await expect(page.locator('[data-testid="metadata-filesize"]')).toBeVisible();
    await expect(page.locator('[data-testid="metadata-mimetype"]')).toBeVisible();
  });

  test('should navigate back to dashboard from viewer', async ({ page }) => {
    await page.goto('/document/1');
    
    // Check for back navigation
    await page.locator('[data-testid="button-back-dashboard"]').click();
    await expect(page).toHaveURL('/dashboard');
  });
});