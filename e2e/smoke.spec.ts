import { expect, test } from '@playwright/test';

const langs = ['fr', 'en', 'ar'] as const;
const paths = ['', '/services', '/portfolio', '/portfolio/farblieferant', '/portfolio/phpmorocco', '/portfolio/aya', '/a-propos', '/contact', '/blog', '/mentions-legales'];

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

// The card must not scroll: everything has to be reachable the moment the QR resolves.
const CARD_VIEWPORTS = [
  { name: 'iPhone SE 1st', width: 320, height: 568 },
  { name: 'iPhone SE 2nd', width: 375, height: 667 },
  { name: 'Galaxy S8', width: 360, height: 740 },
  { name: 'landscape', width: 740, height: 360 },
];

for (const vp of CARD_VIEWPORTS) {
  for (const lang of langs) {
    test(`/${lang}/mycard fits ${vp.name} without scrolling`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/${lang}/mycard`);
      await page.waitForLoadState('load');
      const { scrollH, clientH } = await page.evaluate(() => ({
        scrollH: document.documentElement.scrollHeight,
        clientH: document.documentElement.clientHeight,
      }));
      expect(scrollH, `${vp.name} ${lang} overflows by ${scrollH - clientH}px`).toBeLessThanOrEqual(clientH);
      // Fitting is only meaningful if the last action is genuinely on screen.
      await expect(page.locator('a[href="/makraz.vcf"]')).toBeInViewport();
    });
  }
}

// --- PHP Morocco case study ---

test('the PHP Morocco case study renders its content and meta strip', async ({ page }) => {
  await page.goto('/fr/portfolio/phpmorocco');
  await expect(page.getByRole('heading', { level: 1, name: 'PHP Morocco' })).toBeVisible();
  // Three body sections come from the content collection, not from i18n keys.
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4); // 3 sections + CTA band
  await expect(page.locator('a[href="https://phpmorocco.ma"]')).toBeVisible();
  await expect(page.getByText('Plateforme · i18n · SEO')).toBeVisible();
});

test('the portfolio links through to the PHP Morocco case study', async ({ page }) => {
  await page.goto('/fr/portfolio');
  await page.locator('a[href="/fr/portfolio/phpmorocco"]').click();
  await expect(page).toHaveURL(/\/fr\/portfolio\/phpmorocco$/);
});

test('the arabic case study is RTL and points its back link the right way', async ({ page }) => {
  await page.goto('/ar/portfolio/phpmorocco');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  // In RTL, "back" reads rightwards — the same arrow the Farblieferant case study uses.
  // Matched by text: a bare href selector also hits the header nav's portfolio link.
  await expect(page.getByRole('link', { name: /العودة إلى الأعمال/ })).toContainText('→');
});

// --- Home page structure (stat row replaced; method leads the page) ---

test('the hero is headline, sub and CTAs only', async ({ page }) => {
  await page.goto('/fr');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Développement Web');
  await expect(page.locator('a[href="/fr/contact"].btn-primary')).toBeVisible();
  // Everything that used to sit below the CTAs is gone: the vanity figures, the capability chips,
  // and the positioning paragraph. Any of these reappearing means a revert slipped through.
  await expect(page.getByText('FR·EN·AR')).toHaveCount(0);
  await expect(page.getByText(/Agence de développement web et mobile basée à Marrakech/)).toHaveCount(0);
  await expect(page.locator('a[href="/fr/services"].inline-block')).toHaveCount(0);
});

test('the method comes before the service lines and appears only once', async ({ page }) => {
  await page.goto('/fr');
  const headings = await page.getByRole('heading', { level: 2 }).allInnerTexts();
  const method = headings.findIndex((h) => h.includes("De la découverte à l'adoption"));
  const pillars = headings.findIndex((h) => /métiers\. Un seul partenaire/.test(h));
  expect(method).toBeGreaterThanOrEqual(0);
  // Answer "how do you work?" before listing what you sell.
  expect(method).toBeLessThan(pillars);
  // Moved, not copied — two method sections would mean the old one was left behind.
  expect(headings.filter((h) => h.includes("De la découverte à l'adoption"))).toHaveLength(1);
  for (const step of ['Écouter', 'Concevoir', 'Construire', 'Lancer', 'Accompagner']) {
    await expect(page.getByText(step, { exact: true })).toBeVisible();
  }
});

test('the home page declares a local business with an offer catalogue', async ({ page }) => {
  await page.goto('/fr');
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(raw ?? '{}');
  // ProfessionalService is the LocalBusiness subtype that earns local results.
  expect(data['@type']).toContain('ProfessionalService');
  expect(data.address.addressLocality).toBe('Marrakech');
  expect(data.hasOfferCatalog.itemListElement).toHaveLength(9);
  // The catalogue is no longer mirrored by chips on this page, so it must point at the page that
  // does set the services out in full.
  for (const item of data.hasOfferCatalog.itemListElement) {
    expect(item.itemOffered.url).toBe('https://makraz.com/fr/services');
  }
});

// --- Services anchor index ---

for (const lang of langs) {
  test(`/${lang}/services jump chips all resolve to a real row`, async ({ page }) => {
    await page.goto(`/${lang}/services`);
    const chips = page.locator('nav ul li a[href^="#"]');
    await expect(chips).toHaveCount(9);
    const hrefs = await chips.evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
    for (const href of hrefs) {
      // A chip pointing at a missing id is a dead link that still looks fine — assert the target.
      await expect(page.locator(href)).toHaveCount(1);
    }
  });
}

test('services chips are labelled with the row titles they point at', async ({ page }) => {
  await page.goto('/fr/services');
  const chips = page.locator('nav ul li a[href^="#"]');
  for (let i = 0; i < await chips.count(); i++) {
    const chip = chips.nth(i);
    const href = await chip.getAttribute('href');
    const label = (await chip.innerText()).trim();
    // The row's own bold title must read the same as the chip, so the index can't drift.
    await expect(page.locator(`${href} > div`).first()).toHaveText(label);
  }
});

test('jumping to a service clears the sticky header', async ({ page }) => {
  await page.goto('/fr/services');
  const headerH = await page.locator('header').evaluate((el) => el.getBoundingClientRect().height);
  await page.locator('a[href="#d3"]').click();
  await page.waitForFunction(() => Math.abs(location.hash === '#d3' ? 0 : 1) === 0);
  const top = await page.locator('#d3').evaluate((el) => el.getBoundingClientRect().top);
  // Without scroll-margin the row would sit underneath the sticky header after the jump.
  expect(top).toBeGreaterThanOrEqual(headerH);
});

// --- Technical leadership line (section 04) ---

for (const lang of langs) {
  test(`/${lang}/services lists the technical leadership offers`, async ({ page }) => {
    await page.goto(`/${lang}/services`);
    for (const id of ['t1', 't2', 't3']) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    // The three audit phases sit under the offers, numbered 01-03.
    for (const n of ['01', '02', '03']) {
      await expect(page.locator(`#t2 ~ div >> text=${n}`).first()).toBeVisible();
    }
  });
}

test('the CTO row names both phrasings so either search term lands', async ({ page }) => {
  await page.goto('/en/services');
  await expect(page.locator('#t1')).toContainText('Fractional CTO');
  await expect(page.locator('#t1')).toContainText('CTO on demand');
});

test('the audit phases read in order', async ({ page }) => {
  await page.goto('/en/services');
  const titles = await page.locator('#t2 ~ div .text-\\[19px\\]').allInnerTexts();
  expect(titles.map((s) => s.trim())).toEqual([
    'Where the engineering really stands',
    'The team and the way it works',
    'Decisions, not a report',
  ]);
});

test('the home page presents four service lines', async ({ page }) => {
  await page.goto('/fr');
  await expect(page.getByRole('heading', { level: 2, name: /Quatre métiers/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Direction technique' })).toBeVisible();
  // Stale "trois métiers" copy anywhere would contradict the fourth card.
  await expect(page.getByText('Trois métiers')).toHaveCount(0);
});

// --- Aya Alaoui El Hadari case study ---

test('the portfolio lists Aya directly after Farblieferant', async ({ page }) => {
  await page.goto('/fr/portfolio');
  const order = await page.getByRole('heading', { level: 2 }).allInnerTexts();
  const fb = order.findIndex((h) => h.includes('Farblieferant'));
  const aya = order.findIndex((h) => h.includes('Aya Alaoui El Hadari'));
  const php = order.findIndex((h) => h.includes('PHP Morocco'));
  expect(aya).toBe(fb + 1);
  expect(aya).toBeLessThan(php);
});

test('the Aya portfolio entry links to both the case study and the live site', async ({ page }) => {
  await page.goto('/fr/portfolio');
  await expect(page.locator('a[href="/fr/portfolio/aya"]')).toBeVisible();
  await expect(page.locator('a[href="https://www.ayapsychomotricite.ma"]').first()).toBeVisible();
});

for (const lang of langs) {
  test(`the Aya case study renders in ${lang}`, async ({ page }) => {
    await page.goto(`/${lang}/portfolio/aya`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Three body sections from the content collection, plus the CTA band heading.
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(4);
    await expect(page.locator('a[href="https://www.ayapsychomotricite.ma"]')).toBeVisible();
    // The gallery pairs the French services grid with the Arabic RTL view.
    await expect(page.locator('section img')).toHaveCount(3);
  });
}

// --- Blog index ---

for (const lang of langs) {
  test(`/${lang}/blog lists only real, clickable articles`, async ({ page }) => {
    await page.goto(`/${lang}/blog`);
    const cards = page.locator('section a[href*="/blog/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);
    // It used to render two teaser cards for unwritten articles with no href, so every headline
    // on this page must now lead somewhere.
    const headings = page.locator('section .text-\\[21px\\]');
    await expect(headings).toHaveCount(count);
    for (const href of await cards.evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''))) {
      expect((await page.request.get(href)).status()).toBe(200);
    }
  });
}

test('the blog hub is noindex while the articles stay indexable', async ({ page }) => {
  await page.goto('/fr/blog');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.goto('/fr/blog/seo-multilingue-maroc');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

// --- Service pages (pillar level) ---

const PILLARS = ['developpement', 'design', 'communication', 'direction-technique'];

for (const lang of langs) {
  for (const slug of PILLARS) {
    test(`/${lang}/services/${slug} renders as a pillar page`, async ({ page }) => {
      const res = await page.goto(`/${lang}/services/${slug}`);
      // Every locale must exist: a frontmatter slug once collapsed all three onto one page.
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator(`a[href="/${lang}/services"]`).last()).toBeVisible();
      // Investment + FAQ are required by the schema, so they must always render.
      await expect(page.locator('details')).not.toHaveCount(0);
      await expect(page.locator(`a[href="/${lang}/contact"]`).first()).toBeVisible();
    });
  }
}

test('the services hub links through to each pillar page', async ({ page }) => {
  await page.goto('/fr/services');
  for (const slug of PILLARS) {
    await expect(page.locator(`a[href="/fr/services/${slug}"]`)).toBeVisible();
  }
});

test('a pillar page carries no leaf-only sections yet', async ({ page }) => {
  await page.goto('/fr/services/design');
  // included/steps are leaf-only; if they appear on a pillar the schema guard has been bypassed.
  await expect(page.getByText('Ce qui est inclus')).toHaveCount(0);
  await expect(page.getByText('Comment nous travaillons')).toHaveCount(0);
});

// --- Home selected work + legal page ---

test('the home work grid mirrors the portfolio and links to each case study', async ({ page }) => {
  await page.goto('/fr');
  for (const [href, name] of [
    ['/fr/portfolio/farblieferant', 'Farblieferant'],
    ['/fr/portfolio/aya', 'Cabinet Aya Alaoui El Hadari'],
    ['/fr/portfolio/phpmorocco', 'PHP Morocco'],
  ] as const) {
    await expect(page.locator(`a[href="${href}"]`).filter({ hasText: name })).toBeVisible();
  }
  // Marrakech PHP is a secondary project on the portfolio; it should not headline the home page.
  await expect(page.getByText('Marrakech PHP')).toHaveCount(0);
});

for (const lang of langs) {
  test(`/${lang}/mentions-legales carries no unfinished placeholders`, async ({ page }) => {
    await page.goto(`/${lang}/mentions-legales`);
    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const marker of ['à compléter', 'to be completed', 'يُستكمل', '[tbd]']) {
      expect(body, `${lang} legal page still shows "${marker}"`).not.toContain(marker);
    }
  });
}

// --- Development leaves ---

const DEV_LEAVES = [
  'applications-web-saas', 'applications-mobiles', 'sites-internet', 'e-commerce',
  'mvp-lancement-rapide', 'api-integrations', 'devops-cloud', 'maintenance-optimisation',
];

for (const lang of langs) {
  test(`/${lang}/services leaf pages all render`, async ({ page }) => {
    for (const slug of DEV_LEAVES) {
      const res = await page.goto(`/${lang}/services/${slug}`);
      expect(res?.status(), `${lang}/${slug}`).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
}

test('a leaf page carries the sections a pillar does not', async ({ page }) => {
  await page.goto('/fr/services/e-commerce');
  await expect(page.getByText('Ce qui est inclus')).toBeVisible();
  await expect(page.getByText('Comment nous travaillons')).toBeVisible();
  // Only genuine matches get a case study: e-commerce -> Farblieferant.
  await expect(page.locator('a[href="/fr/portfolio/farblieferant"]')).toBeVisible();
  // And it offers its siblings rather than dead-ending.
  await expect(page.locator('a[href="/fr/services/applications-mobiles"]')).toBeVisible();
});

test('the development pillar lists all eight of its children', async ({ page }) => {
  await page.goto('/fr/services/developpement');
  for (const slug of DEV_LEAVES) {
    await expect(page.locator(`a[href="/fr/services/${slug}"]`)).toBeVisible();
  }
});

test('services with no genuine project show no case study', async ({ page }) => {
  await page.goto('/fr/services/devops-cloud');
  await expect(page.getByText('Étude de cas')).toHaveCount(0);
});
