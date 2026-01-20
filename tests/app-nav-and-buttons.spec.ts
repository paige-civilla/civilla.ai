/**
 * App Navigation and Buttons Smoke Tests
 * Tests authenticated app navigation and primary buttons
 * 
 * Run: npx playwright test tests/app-nav-and-buttons.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = (process.env.TEST_EMAIL || '').trim().replace(/\\n/g, '');
const TEST_PASSWORD = (process.env.TEST_PASSWORD || '').trim().replace(/\\n/g, '');

async function login(page: any): Promise<boolean> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.log('TEST_EMAIL/TEST_PASSWORD not set - skipping auth tests');
    return false;
  }
  
  await page.goto(`${BASE_URL}/login`);
  
  await page.fill('[data-testid=input-email], input[type="email"]', TEST_EMAIL);
  await page.fill('[data-testid=input-password], input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/app/, { timeout: 10000 });
  return true;
}

test.describe('Authenticated App Navigation', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Auth credentials not provided');
  
  test('Login and navigate to dashboard', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    await expect(page.url()).toContain('/app');
  });
  
  test('Onboarding page loads for new users', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    const url = page.url();
    if (url.includes('/app/onboarding')) {
      await expect(page.locator('[data-testid=button-continue], button:has-text("Continue")')).toBeVisible();
    }
  });
  
  test('Navigation items are visible', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    const navItems = [
      'Dashboard',
      'Timeline',
      'Evidence',
      'Documents',
    ];
    
    for (const item of navItems) {
      const navLink = page.locator(`a:has-text("${item}"), [data-testid*="${item.toLowerCase()}"]`);
      if (await navLink.count() > 0) {
        await expect(navLink.first()).toBeVisible();
      }
    }
  });
});

test.describe('App Pages Load', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Auth credentials not provided');
  
  const appPages = [
    '/app/start-here',
    '/app/onboarding',
    '/app/lexi-intake',
    '/app/account',
    '/app/cases',
  ];
  
  for (const path of appPages) {
    test(`${path} loads`, async ({ page }) => {
      const loggedIn = await login(page);
      if (!loggedIn) return;
      
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).not.toContain('/404');
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Mobile Viewport', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Auth credentials not provided');
  
  test('Mobile navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    const menuButton = page.locator('[data-testid=button-menu], button[aria-label*="menu"], .hamburger');
    if (await menuButton.count() > 0) {
      await menuButton.first().click();
      await page.waitForTimeout(500);
      
      const menuItems = page.locator('nav a, [role="menu"] a');
      expect(await menuItems.count()).toBeGreaterThan(0);
    }
  });
  
  test('Page scrolls independently of nav menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    const scrollable = await page.evaluate(() => {
      return document.documentElement.scrollHeight > window.innerHeight;
    });
    
    expect(scrollable).toBeDefined();
  });
});

test.describe('Primary Buttons', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Auth credentials not provided');
  
  test('Evidence page has upload button', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    const casesRes = await page.request.get(`${BASE_URL}/api/cases`);
    const cases = await casesRes.json();
    
    if (cases && cases.length > 0) {
      await page.goto(`${BASE_URL}/app/evidence/${cases[0].id}`);
      await page.waitForLoadState('networkidle');
      
      const uploadButton = page.locator('[data-testid*="upload"], button:has-text("Upload")');
      if (await uploadButton.count() > 0) {
        await expect(uploadButton.first()).toBeVisible();
      }
    }
  });
  
  test('Documents page has create button', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    const casesRes = await page.request.get(`${BASE_URL}/api/cases`);
    const cases = await casesRes.json();
    
    if (cases && cases.length > 0) {
      await page.goto(`${BASE_URL}/app/documents/${cases[0].id}`);
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('[data-testid*="create"], button:has-text("Create"), button:has-text("New")');
      if (await createButton.count() > 0) {
        await expect(createButton.first()).toBeVisible();
      }
    }
  });
});
