import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should have working main navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation elements
    await expect(page.locator('[data-testid="nav-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-pricing"]')).toBeVisible();
  });

  test('should navigate between pages correctly', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to pricing
    await page.locator('[data-testid="nav-pricing"]').click();
    await expect(page).toHaveURL('/pricing');
    
    // Navigate to dashboard
    await page.locator('[data-testid="nav-dashboard"]').click();
    await expect(page).toHaveURL('/dashboard');
    
    // Navigate back to home
    await page.locator('[data-testid="nav-logo"]').click();
    await expect(page).toHaveURL('/');
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check active state styling
    const pricingNav = page.locator('[data-testid="nav-pricing"]');
    await expect(pricingNav).toHaveClass(/active|current|selected/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile navigation (hamburger menu if exists)
    const mobileNav = page.locator('[data-testid="nav-mobile-toggle"]');
    if (await mobileNav.isVisible()) {
      await mobileNav.click();
      await expect(page.locator('[data-testid="nav-mobile-menu"]')).toBeVisible();
    }
  });

  test('should maintain navigation across page refreshes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.reload();
    
    // Navigation should still be visible and functional
    await expect(page.locator('[data-testid="nav-logo"]')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });
});