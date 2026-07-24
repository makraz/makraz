import { expect, test } from '@playwright/test';

const langs = ['fr', 'en', 'ar'] as const;
const paths = ['', '/services', '/portfolio', '/portfolio/farblieferant', '/a-propos', '/contact', '/blog', '/mentions-legales'];

for (const lang of langs) {
  for (const path of paths) {
    test(`renders /${lang}${path}`, async ({ page }) => {
      const res = await page.goto(`/${lang}${path}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  }
}

test('root redirects to /fr', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/fr\/?$/);
});

test('arabic pages are RTL with arabic font override', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('language switcher cycles fr → en on the same page', async ({ page }) => {
  await page.goto('/fr/services');
  await page.locator('header a[href="/en/services"]').click();
  await expect(page).toHaveURL(/\/en\/services\/?$/);
});

test('blog article renders', async ({ page }) => {
  await page.goto('/fr/blog');
  const article = page.locator('main a[href*="/fr/blog/"], a[href*="/fr/blog/"]').first();
  await article.click();
  await expect(page.locator('h1')).toBeVisible();
});

test('contact form success path (mocked endpoint)', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
  await page.goto('/fr/contact');
  await page.fill('input[name="name"]', 'Test');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('textarea[name="message"]', 'Bonjour');
  await page.click('#mk-contact button[type="submit"]');
  await expect(page.locator('#form-sent')).toBeVisible();
});

test('contact form error path (mocked endpoint)', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"send"}' }),
  );
  await page.goto('/fr/contact');
  await page.fill('input[name="name"]', 'Test');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('textarea[name="message"]', 'Bonjour');
  await page.click('#mk-contact button[type="submit"]');
  await expect(page.locator('#form-error')).toBeVisible();
});
