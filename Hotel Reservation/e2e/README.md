# End-to-End (E2E) Testing Suite

This directory contains comprehensive end-to-end tests for the Phoenix Booking application using Playwright.

## Overview

E2E tests verify critical user workflows across the entire application stack, from frontend to backend services and database.

## Test Categories

1. **Authentication** - User registration, login, logout, password reset
2. **Hotel Search** - Search functionality, filters, sorting
3. **Booking Flow** - Complete reservation process with payment
4. **Hotel Management** - Owner operations (CRUD hotels, rooms)
5. **User Profile** - Profile updates, preferences
6. **Admin Operations** - Admin dashboard, user management

## Tech Stack

- **Framework**: [Playwright](https://playwright.dev/) v1.40+
- **Language**: TypeScript
- **Assertions**: Playwright Test (built-in)
- **Reporting**: HTML Reporter, JUnit XML
- **CI Integration**: GitHub Actions

## Installation

```bash
cd e2e
npm install
npx playwright install
```

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run in headed mode (see browser)
npm test -- --headed

# Run specific test file
npm test -- auth.spec.ts

# Run tests in debug mode
npm test -- --debug

# Run with UI mode
npm test -- --ui
```

### Against Different Environments

```bash
# Local
BASE_URL=http://localhost:4173 npm test

# Staging
BASE_URL=https://staging.phoenix-booking.com npm test

# Production (smoke tests only)
BASE_URL=https://phoenix-booking.com npm test -- --grep @smoke
```

## Test Structure

```
e2e/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── register.spec.ts
│   │   └── password-reset.spec.ts
│   ├── booking/
│   │   ├── search-hotels.spec.ts
│   │   ├── create-booking.spec.ts
│   │   └── cancel-booking.spec.ts
│   ├── hotels/
│   │   ├── create-hotel.spec.ts
│   │   ├── update-hotel.spec.ts
│   │   └── delete-hotel.spec.ts
│   └── smoke/
│       └── critical-paths.spec.ts
├── fixtures/
│   ├── users.ts
│   ├── hotels.ts
│   └── test-data.ts
├── page-objects/
│   ├── LoginPage.ts
│   ├── HomePage.ts
│   ├── SearchPage.ts
│   └── BookingPage.ts
├── utils/
│   ├── api-helpers.ts
│   ├── test-helpers.ts
│   └── db-helpers.ts
├── playwright.config.ts
└── package.json
```

## Writing Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { testUsers } from '../fixtures/users';

test.describe('User Authentication', () => {
  test('should login successfully with valid credentials @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(testUsers.customer.email, testUsers.customer.password);

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@test.com', 'wrongpassword');

    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });
});
```

### Page Object Example

```typescript
// page-objects/LoginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async loginWithGoogle() {
    await this.page.getByRole('button', { name: 'Continue with Google' }).click();
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

E2E tests run automatically on:
- Pull requests to `main` and `develop`
- After deployment to staging
- Scheduled nightly runs

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [develop, main]
  pull_request:
  schedule:
    - cron: '0 2 * * *'  # Run at 2 AM daily

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: |
          cd e2e
          npm ci
          npx playwright install --with-deps
      - name: Run E2E tests
        run: |
          cd e2e
          npm test
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

## Test Data Management

### Test Users

```typescript
// fixtures/users.ts
export const testUsers = {
  customer: {
    email: 'customer@test.phoenix-booking.com',
    password: 'TestPassword123!',
    role: 'customer'
  },
  hotelOwner: {
    email: 'owner@test.phoenix-booking.com',
    password: 'TestPassword123!',
    role: 'hotel_owner'
  },
  admin: {
    email: 'admin@test.phoenix-booking.com',
    password: 'AdminPassword123!',
    role: 'admin'
  }
};
```

### Database Seeding

```typescript
// utils/db-helpers.ts
import { MongoClient } from 'mongodb';

export async function seedTestData() {
  const client = new MongoClient(process.env.MONGO_URL!);
  await client.connect();

  const db = client.db('hotel-booking-test');

  // Create test users
  await db.collection('users').insertMany([
    { email: 'customer@test.com', role: 'customer', ... },
    { email: 'owner@test.com', role: 'hotel_owner', ... }
  ]);

  // Create test hotels
  await db.collection('hotels').insertMany([
    { name: 'Test Hotel 1', city: 'New York', ... },
    { name: 'Test Hotel 2', city: 'Los Angeles', ... }
  ]);

  await client.close();
}
```

## Best Practices

1. **Use Page Objects** - Encapsulate page interactions
2. **Tag Tests** - Use `@smoke`, `@regression`, `@critical` tags
3. **Independent Tests** - Each test should be able to run standalone
4. **Cleanup** - Clean up test data after tests
5. **Stable Selectors** - Use `data-testid` attributes, not fragile selectors
6. **Retries** - Configure retries for flaky tests (max 2)
7. **Parallelization** - Run tests in parallel when possible
8. **Screenshots** - Capture screenshots on failures
9. **Videos** - Record videos for failed tests only
10. **API Testing** - Test API endpoints directly when appropriate

## Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'results.xml' }],
    ['github']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

## Troubleshooting

### Tests Timing Out

Increase timeout in specific tests:

```typescript
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

### Flaky Tests

1. Use `waitForSelector` instead of hardcoded waits
2. Wait for network idle: `await page.waitForLoadState('networkidle')`
3. Use `toBeVisible()` assertions to ensure elements are ready
4. Increase action timeout: `await element.click({ timeout: 10000 })`

### Authentication Issues

Use Playwright's authentication storage:

```typescript
// global-setup.ts
async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('/login');
  await page.fill('[name="email"]', 'test@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}

// In tests:
test.use({ storageState: 'auth.json' });
```

## Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports include:
- Test results with pass/fail status
- Screenshots of failures
- Videos of failed test runs
- Trace viewer for debugging

## Contributing

When adding new E2E tests:

1. Create tests in the appropriate category folder
2. Use existing page objects or create new ones
3. Add test data to fixtures if needed
4. Tag tests appropriately (`@smoke`, `@regression`, etc.)
5. Ensure tests pass locally before committing
6. Update this README if adding new test categories
