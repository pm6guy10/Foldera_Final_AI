import { test, expect } from '@playwright/test';

test.describe('Stripe Checkout Tests', () => {
  test('should redirect to Stripe checkout for Self-Serve tier', async ({ page }) => {
    await page.goto('/pricing');
    
    // Click Self-Serve tier button
    await page.locator('[data-testid="button-checkout-self-serve"]').click();
    
    // Should redirect to Stripe checkout
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
  });

  test('should redirect to Stripe checkout for Pro tier', async ({ page }) => {
    await page.goto('/pricing');
    
    // Click Pro tier button
    await page.locator('[data-testid="button-checkout-pro"]').click();
    
    // Should redirect to Stripe checkout
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
  });

  test('should redirect to Stripe checkout for Pilot tier', async ({ page }) => {
    await page.goto('/pricing');
    
    // Click Pilot tier button
    await page.locator('[data-testid="button-checkout-pilot"]').click();
    
    // Should redirect to Stripe checkout
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
  });

  test('should handle checkout success page', async ({ page }) => {
    await page.goto('/checkout-success?session_id=test_session_123');
    
    // Verify success page elements
    await expect(page.locator('[data-testid="success-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('successful');
    await expect(page.locator('[data-testid="button-continue-dashboard"]')).toBeVisible();
  });

  test('should handle checkout cancel page', async ({ page }) => {
    await page.goto('/checkout-cancel');
    
    // Verify cancel page elements
    await expect(page.locator('[data-testid="cancel-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-message"]')).toContainText('cancelled');
    await expect(page.locator('[data-testid="button-try-again"]')).toBeVisible();
  });

  test('should display pricing tiers correctly', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check all three pricing tiers
    await expect(page.locator('[data-testid="tier-self-serve"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-pro"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-pilot"]')).toBeVisible();
    
    // Verify pricing display
    await expect(page.locator('[data-testid="price-self-serve"]')).toContainText('$99');
    await expect(page.locator('[data-testid="price-pro"]')).toContainText('$399');
    await expect(page.locator('[data-testid="price-pilot"]')).toContainText('$5,000');
  });
});