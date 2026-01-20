/**
 * Marketing Links Smoke Tests
 * Tests all marketing page links and navigation
 * 
 * Run: npx playwright test tests/marketing-links.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const marketingPages = [
  { path: '/', name: 'Home' },
  { path: '/how-civilla-works', name: 'How Civilla Works' },
  { path: '/meet-the-founders', name: 'Meet the Founders' },
  { path: '/our-mission', name: 'Our Mission' },
  { path: '/plans', name: 'Plans' },
  { path: '/legal-compliance', name: 'Legal Compliance' },
  { path: '/privacy-policy', name: 'Privacy Policy' },
  { path: '/safety-support', name: 'Safety Support' },
  { path: '/accessibility', name: 'Accessibility' },
  { path: '/contact', name: 'Contact' },
  { path: '/terms', name: 'Terms of Service' },
  { path: '/careers', name: 'Careers' },
  { path: '/wall-of-wins', name: 'Wall of Wins' },
  { path: '/faq', name: 'FAQ' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
];

test.describe('Marketing Pages', () => {
  for (const page of marketingPages) {
    test(`${page.name} (${page.path}) loads without errors`, async ({ page: browserPage }) => {
      const errors: string[] = [];
      
      browserPage.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      browserPage.on('pageerror', err => {
        errors.push(err.message);
      });
      
      const response = await browserPage.goto(`${BASE_URL}${page.path}`);
      
      expect(response?.status()).toBeLessThan(400);
      expect(browserPage.url()).not.toContain('/404');
      
      await expect(browserPage.locator('body')).toBeVisible();
      
      const criticalErrors = errors.filter(e => 
        !e.includes('favicon') && 
        !e.includes('manifest') &&
        !e.includes('Warning:')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  }
});

test.describe('Navigation Links', () => {
  test('Header navigation works', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const navLinks = page.locator('header a, nav a');
    const count = await navLinks.count();
    
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');
      
      if (href && href.startsWith('/') && !href.startsWith('/app')) {
        await link.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).not.toContain('/404');
        await page.goto(BASE_URL);
      }
    }
  });
  
  test('Footer links work', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();
    
    expect(count).toBeGreaterThan(0);
  });
  
  test('Login page has form elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await expect(page.locator('[data-testid=input-email], input[type="email"]')).toBeVisible();
    await expect(page.locator('[data-testid=input-password], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
  
  test('Register page has form elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    await expect(page.locator('[data-testid=input-email], input[type="email"]')).toBeVisible();
    await expect(page.locator('[data-testid=input-password], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe('External Links', () => {
  test('External links have proper attributes', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const externalLinks = page.locator('a[href^="http"]:not([href*="localhost"])');
    const count = await externalLinks.count();
    
    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      const target = await link.getAttribute('target');
      const rel = await link.getAttribute('rel');
      
      if (target === '_blank') {
        expect(rel).toContain('noopener');
      }
    }
  });
});
