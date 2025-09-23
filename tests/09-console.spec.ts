import { test, expect } from '@playwright/test';

test.describe('Console and Error Tests', () => {
  test('should have no console errors on home page', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    expect(errors).toHaveLength(0);
  });

  test('should have no console errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('should have no console errors on pricing page', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort());
    
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/dashboard');
    
    // Should handle API failures without crashing
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    
    // May have network errors but should not crash
    await page.waitForTimeout(2000);
  });

  test('should handle JavaScript runtime errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for runtime errors
    expect(errors).toHaveLength(0);
  });

  test('should load all resources successfully', async ({ page }) => {
    const failedRequests: string[] = [];
    
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known optional failures
    const criticalFailures = failedRequests.filter(url => 
      !url.includes('favicon') && 
      !url.includes('analytics') &&
      !url.includes('googletagmanager')
    );
    
    expect(criticalFailures).toHaveLength(0);
  });
});