import { test, expect } from '@playwright/test';

test.describe('Dashboard Tests', () => {
  test('should display dashboard metrics correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check main dashboard elements
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Dashboard');
    
    // Verify metrics cards
    await expect(page.locator('[data-testid="metric-documents"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-discrepancies"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-violations"]')).toBeVisible();
    
    // Check for proper count display
    const discrepancyCount = await page.locator('[data-testid="count-discrepancies"]').textContent();
    expect(discrepancyCount).toMatch(/^\d+$/);
  });

  test('should show zero state when no documents', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for zero state message
    const documentCount = await page.locator('[data-testid="count-documents"]').textContent();
    if (documentCount === '0') {
      await expect(page.locator('[data-testid="zero-state-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="button-upload-cta"]')).toBeVisible();
    }
  });

  test('should navigate to document viewer from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for view buttons
    const viewButtons = page.locator('[data-testid^="button-view-"]');
    const buttonCount = await viewButtons.count();
    
    if (buttonCount > 0) {
      await viewButtons.first().click();
      await expect(page).toHaveURL(/\/document\/\d+/);
    }
  });

  test('should display document metadata correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for document cards with proper metadata
    const documentCards = page.locator('[data-testid^="card-document-"]');
    const cardCount = await documentCards.count();
    
    if (cardCount > 0) {
      const firstCard = documentCards.first();
      await expect(firstCard.locator('[data-testid^="text-filename-"]')).not.toContainText('Unknown file');
      await expect(firstCard.locator('[data-testid^="text-filesize-"]')).not.toContainText('0 Bytes');
    }
  });
});