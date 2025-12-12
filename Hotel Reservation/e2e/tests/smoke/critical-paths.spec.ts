import { test, expect } from '@playwright/test';

/**
 * Smoke tests for critical user paths
 * These tests should run on every deployment to verify core functionality
 */

test.describe('Critical Paths @smoke', () => {
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Verify page loads
    await expect(page).toHaveTitle(/Phoenix Booking|Hotel/i);

    // Verify key elements are visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('User can search for hotels', async ({ page }) => {
    await page.goto('/');

    // Fill search form
    await page.getByPlaceholder(/destination|city|location/i).fill('New York');
    await page.getByLabel(/check-in|arrival/i).fill('2025-12-20');
    await page.getByLabel(/check-out|departure/i).fill('2025-12-25');
    await page.getByLabel(/guests|people/i).fill('2');

    // Submit search
    await page.getByRole('button', { name: /search/i }).click();

    // Verify results page loads
    await expect(page).toHaveURL(/search|hotels/);
    await expect(page.getByText(/results|hotels found/i)).toBeVisible();
  });

  test('API health check returns 200', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
  });

  test('User can view hotel details', async ({ page }) => {
    await page.goto('/');

    // Search for hotels
    await page.getByPlaceholder(/destination/i).fill('Los Angeles');
    await page.getByRole('button', { name: /search/i }).click();

    // Wait for results
    await page.waitForSelector('[data-testid="hotel-card"]', { timeout: 10000 });

    // Click first hotel
    await page.getByTestId('hotel-card').first().click();

    // Verify hotel details page
    await expect(page).toHaveURL(/\/hotels\/\w+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/room|amenities|facilities/i)).toBeVisible();
  });

  test('Navigation menu works correctly', async ({ page }) => {
    await page.goto('/');

    // Check all main navigation links
    const nav = page.getByRole('navigation').first();

    await expect(nav.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /hotels|search/i })).toBeVisible();

    // Test navigation
    await nav.getByRole('link', { name: /hotels|search/i }).click();
    await expect(page).toHaveURL(/search|hotels/);
  });

  test('Footer contains required information', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');

    await expect(footer).toBeVisible();
    await expect(footer.getByText(/phoenix booking/i)).toBeVisible();
    await expect(footer.getByText(/contact|about|privacy|terms/i)).toBeVisible();
  });

  test('Responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/');

    // Verify mobile menu
    const mobileMenu = page.getByRole('button', { name: /menu|navigation/i });
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }

    // Verify content is readable
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Can access login page', async ({ page }) => {
    await page.goto('/');

    // Navigate to login
    await page.getByRole('link', { name: /login|sign in/i }).click();

    // Verify login page
    await expect(page).toHaveURL(/login|signin/);
    await expect(page.getByLabel(/email|username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });
});
