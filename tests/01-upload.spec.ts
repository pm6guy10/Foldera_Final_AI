import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Document Upload Tests', () => {
  test('should upload PDF document successfully', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to upload section
    await page.locator('[data-testid="button-upload"]').click();
    
    // Upload PDF file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/sample1.pdf'));
    
    // Verify upload initiated
    await expect(page.locator('[data-testid="upload-status"]')).toContainText('Uploading');
    
    // Wait for processing
    await expect(page.locator('[data-testid="upload-status"]')).toContainText('Processing', { timeout: 10000 });
    
    // Verify success
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 15000 });
  });

  test('should upload DOCX document successfully', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('[data-testid="button-upload"]').click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/sample.docx'));
    
    await expect(page.locator('[data-testid="upload-status"]')).toContainText('Processing', { timeout: 10000 });
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 15000 });
  });

  test('should upload TXT document successfully', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('[data-testid="button-upload"]').click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/sample.txt'));
    
    await expect(page.locator('[data-testid="upload-status"]')).toContainText('Processing', { timeout: 10000 });
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 15000 });
  });

  test('should handle multiple file uploads', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('[data-testid="button-upload"]').click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      path.join(__dirname, 'fixtures/sample1.pdf'),
      path.join(__dirname, 'fixtures/sample2.pdf')
    ]);
    
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 20000 });
  });
});