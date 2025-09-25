import { test, expect } from '@playwright/test';

test.describe('Footer Tests', () => {
  test('should display correct copyright year', async ({ page }) => {
    await page.goto('/');
    
    // Check footer copyright
    await expect(page.locator('[data-testid="footer-copyright"]')).toContainText('© 2025 Foldera');
  });

  test('should have consistent footer across all pages', async ({ page }) => {
    const pages = ['/', '/pricing', '/dashboard'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await expect(page.locator('[data-testid="footer"]')).toBeVisible();
      await expect(page.locator('[data-testid="footer-copyright"]')).toContainText('© 2025 Foldera');
    }
  });

  test('should have working footer navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check for common footer links
    const footerLinks = page.locator('[data-testid^="footer-link-"]');
    const linkCount = await footerLinks.count();
    
    if (linkCount > 0) {
      // Test first footer link
      const firstLink = footerLinks.first();
      const href = await firstLink.getAttribute('href');
      expect(href).not.toBeNull();
    }
  });

  test('should display company information', async ({ page }) => {
    await page.goto('/');
    
    // Check for company name in footer
    await expect(page.locator('[data-testid="footer"]')).toContainText('Foldera');
  });

  test('should be responsive in footer design', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });
});