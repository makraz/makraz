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

test('contact API validates without mocks', async ({ request }) => {
  const res = await request.post('/api/contact', {
    headers: { Accept: 'application/json', Origin: 'http://localhost:4331' },
    form: { name: 'Test', email: 'not-an-email', message: 'Bonjour', lang: 'fr' },
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.ok).toBe(false);
  expect(body.errors).toHaveProperty('email');
});

// --- Business card (/mycard, the printed QR destination) ---

for (const lang of langs) {
  test(`renders the business card at /${lang}/mycard`, async ({ page }) => {
    const res = await page.goto(`/${lang}/mycard`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('MAKRAZ SARLAU');
    // Deliberately chrome-free: a card scan should not land you in site navigation.
    await expect(page.locator('header')).toHaveCount(0);
    await expect(page.locator('footer')).toHaveCount(0);
    await expect(page.locator('a[href="tel:+212661764392"]')).toBeVisible();
    await expect(page.locator('a[href="https://wa.me/212661764392"]')).toBeVisible();
    await expect(page.locator('a[href="mailto:contact@makraz.com"]')).toBeVisible();
    await expect(page.locator('a[href="/makraz.vcf"][download]')).toBeVisible();
  });
}

test('the arabic card is RTL', async ({ page }) => {
  await page.goto('/ar/mycard');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('card pages are noindex and offer all three languages', async ({ page }) => {
  await page.goto('/fr/mycard');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  for (const lang of langs) {
    await expect(page.locator(`nav a[href="/${lang}/mycard"]`)).toBeVisible();
  }
});

test('/mycard forwards to a localized card and leaves no history entry', async ({ page }) => {
  await page.goto('/fr/services');
  await page.goto('/mycard');
  await expect(page).toHaveURL(/\/(fr|en|ar)\/mycard$/);
  // location.replace, so going back skips the router page entirely.
  await page.goBack();
  await expect(page).toHaveURL(/\/fr\/services$/);
});

test('the vCard is served with the right fields', async ({ request }) => {
  const res = await request.get('/makraz.vcf');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('ORG:MAKRAZ SARLAU');
  expect(body).toContain('TEL;TYPE=WORK,VOICE:+212661764392');
});

// --- Portfolio hierarchy ---

test('portfolio leads with the two flagship projects and demotes Marrakech PHP', async ({ page }) => {
  await page.goto('/fr/portfolio');
  // Farblieferant and PHP Morocco keep h2 sections; Marrakech PHP is now an h3 card, so a
  // regression that promotes it back to a full section fails here.
  await expect(page.getByRole('heading', { level: 2, name: 'Farblieferant' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'PHP Morocco' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Marrakech PHP' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 3, name: 'Marrakech PHP' })).toBeVisible();
  await expect(page.locator('a[href="https://marrakechphp.ma"]')).toBeVisible();
});

test('portfolio shows the unnamed upcoming project without a link', async ({ page }) => {
  await page.goto('/fr/portfolio');
  const card = page.locator('article', { hasText: 'Nouveau projet' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('Bientôt');
  // The teaser is deliberately anonymous: no client name, nothing to click through to.
  await expect(card.locator('a')).toHaveCount(0);
});
