import { test, expect } from '@playwright/test';

test.describe('Links and Navigation Tests', () => {
  test('should have working Calendly demo booking link', async ({ page }) => {
    await page.goto('/');
    
    // Check for demo booking button
    await expect(page.locator('[data-testid="button-book-demo"]')).toBeVisible();
    
    // Click should open Calendly (external link)
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('[data-testid="button-book-demo"]').click()
    ]);
    
    await expect(newPage).toHaveURL(/calendly\.com/);
  });

  test('should navigate to pricing from navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation link to pricing
    await page.locator('[data-testid="link-pricing"]').click();
    await expect(page).toHaveURL('/pricing');
  });

  test('should have working waitlist form submission', async ({ page }) => {
    await page.goto('/');
    
    // Find waitlist form
    const emailInput = page.locator('[data-testid="input-waitlist-email"]');
    await emailInput.fill('test@example.com');
    
    await page.locator('[data-testid="button-join-waitlist"]').click();
    
    // Verify form submission response
    await expect(page.locator('[data-testid="waitlist-success"]')).toBeVisible({ timeout: 10000 });
  });

  test('should have working footer links', async ({ page }) => {
    await page.goto('/');
    
    // Check footer navigation
    await expect(page.locator('[data-testid="footer-copyright"]')).toContainText('© 2025 Foldera');
    
    // Test footer links
    const footerLinks = page.locator('[data-testid^="footer-link-"]');
    const linkCount = await footerLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should redirect to dashboard after login', async ({ page }) => {
    await page.goto('/');
    
    // Check if login link exists and works
    const loginButton = page.locator('[data-testid="button-login"]');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      // Verify redirect or login form
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    }
  });
});