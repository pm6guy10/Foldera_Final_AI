import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`should display correctly on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      // Check main elements are visible
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-logo"]')).toBeVisible();
      
      // Check responsive layout
      if (width < 768) {
        // Mobile specific checks
        const hero = page.locator('[data-testid="hero-section"]');
        const boundingBox = await hero.boundingBox();
        expect(boundingBox?.width).toBeLessThanOrEqual(width);
      }
    });

    test(`should handle dashboard on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard');
      
      // Dashboard should be responsive
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      
      // Metrics should stack on mobile
      const metrics = page.locator('[data-testid^="metric-"]');
      const metricCount = await metrics.count();
      
      if (metricCount > 0) {
        await expect(metrics.first()).toBeVisible();
      }
    });

    test(`should handle forms on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      // Form elements should be accessible
      const emailInput = page.locator('[data-testid="input-waitlist-email"]');
      if (await emailInput.isVisible()) {
        await expect(emailInput).toBeVisible();
        
        // Input should be appropriately sized
        const inputBox = await emailInput.boundingBox();
        expect(inputBox?.width).toBeGreaterThan(100);
        expect(inputBox?.width).toBeLessThanOrEqual(width * 0.9);
      }
    });
  });

  test('should handle orientation changes', async ({ page }) => {
    // Start in portrait mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Rotate to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Check layout still works
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-logo"]')).toBeVisible();
  });
});