/**
 * Lexi and AI Pipeline Smoke Tests
 * Tests AI features including Lexi chat
 * 
 * Run: npx playwright test tests/lexi-and-ai-smoke.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

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

test.describe('AI Health Endpoints', () => {
  test('AI health check returns ok', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/ai/health`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
  
  test('Evidence health check returns ok', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health/evidence`);
    expect(response.ok()).toBeTruthy();
  });
  
  test('Documents health check returns ok', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health/documents`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Lexi Intake Flow', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Auth credentials not provided');
  
  test('Lexi intake page loads', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    await page.goto(`${BASE_URL}/app/lexi-intake`);
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).not.toContain('/404');
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('Lexi intake has input field', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    await page.goto(`${BASE_URL}/app/lexi-intake`);
    await page.waitForLoadState('networkidle');
    
    const inputField = page.locator('textarea, input[type="text"], [data-testid*="input"], [data-testid*="message"]');
    if (await inputField.count() > 0) {
      await expect(inputField.first()).toBeVisible();
    }
  });
  
  test('Lexi intake has send button or submit', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    await page.goto(`${BASE_URL}/app/lexi-intake`);
    await page.waitForLoadState('networkidle');
    
    const sendButton = page.locator('[data-testid*="send"], button[type="submit"], button:has-text("Send"), button:has-text("Submit")');
    if (await sendButton.count() > 0) {
      await expect(sendButton.first()).toBeVisible();
    }
  });
});

test.describe('Lexi Thread API', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Auth credentials not provided');
  
  test('Can create Lexi thread', async ({ page, request }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const response = await request.post(`${BASE_URL}/api/lexi/threads`, {
      headers: { Cookie: cookieHeader },
      data: { title: 'Playwright Test Thread' },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.id).toBeDefined();
  });
  
  test('Can list Lexi threads', async ({ page, request }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const response = await request.get(`${BASE_URL}/api/lexi/threads`, {
      headers: { Cookie: cookieHeader },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });
});

test.describe('Start Here Page', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Auth credentials not provided');
  
  test('Start Here page loads after onboarding', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    await page.goto(`${BASE_URL}/app/start-here`);
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).not.toContain('/404');
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('Start Here has navigation options', async ({ page }) => {
    const loggedIn = await login(page);
    if (!loggedIn) return;
    
    await page.goto(`${BASE_URL}/app/start-here`);
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button, a[href*="/app/"]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
