# Dedicated Service Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every service its own page — `/services` links to 3 pillar pages and 17 leaf pages, each with substantially more information, in `fr`/`en`/`ar`.

**Architecture:** One new Astro content collection (`services`) holds 60 markdown files (20 services × 3 locales): structured frontmatter for lists, markdown body for prose. A single dynamic route `src/pages/[lang]/services/[slug].astro` renders both pillar and leaf pages. All taxonomy logic (parent/child/sibling resolution) lives in pure functions in `src/lib/services.ts` so it is unit-testable without rendering.

**Tech Stack:** Astro 7.1.3 (`output: 'static'`, `@astrojs/cloudflare` 14), Tailwind CSS 4, Zod (via `astro:content`), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-26-service-pages-design.md`

## Global Constraints

- **Three locales, always.** Every service must exist as `<slug>.fr.md`, `<slug>.en.md`, `<slug>.ar.md`. No locale may be skipped or left holding another locale's language.
- **No placeholder markers in content.** Never write `[à valider]`, `[to confirm]`, `[à compléter]`, `[TBD]` or equivalents in any `.md` file. This was an explicit user instruction after such markers shipped to production once.
- **No pricing figures.** `engagement.model` and `engagement.drivers` describe the engagement model and cost drivers only. No amounts, no currencies, no "à partir de X".
- **No client tech stack.** Never name the technologies used on a client platform (the Farblieferant stack was removed from the site for this reason). Naming MAKRAZ's own capabilities in generic terms is fine; naming a specific client's stack is not.
- **French slugs in all three locales**, matching the existing `/a-propos` and `/mentions-legales` convention.
- **Reuse existing components and tokens.** `SectionIntro`, `Kicker`, `Screenshot`, `CtaBand`, the `grid-cols-[260px_1fr]` row pattern, the `<details>` FAQ pattern. Only one new component is authorised: `ServiceCard.astro`.
- **Case-study section only where genuine:** `e-commerce` → Farblieferant, `sites-internet` → PHPMorocco, `reseaux-sociaux` → MarrakechPHP. Every other service has no case-study section. Do not invent mappings.
- **New UI strings** go into all three `src/i18n/*.json` under the `service.*` namespace **and** into `MANUAL_KEYS` in `scripts/extract-i18n.mjs`, or `npm run extract:i18n` will drop them.
- **Commit after every task.** Single-line commit messages, no body, no `Co-Authored-By` trailers (see `~/.claude/CLAUDE.md`).
- **A push does not deploy.** Cloudflare Workers Builds is not connected. Production updates require `npm run build && npx wrangler deploy`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/content.config.ts` | **Modify** — add the `services` collection schema |
| `src/lib/services.ts` | **Create** — pure taxonomy functions over service data |
| `tests/services.test.ts` | **Create** — unit tests for the taxonomy functions |
| `tests/services-content.test.ts` | **Create** — integrity tests reading the real `.md` files |
| `src/components/ServiceCard.astro` | **Create** — card used by sibling and child grids |
| `src/pages/[lang]/services/[slug].astro` | **Create** — the one route for pillar + leaf pages |
| `src/content/services/*.md` | **Create** — 60 content files |
| `src/pages/[lang]/services.astro` | **Modify** — make line items and pillar headings links |
| `src/i18n/{fr,en,ar}.json` | **Modify** — `service.*` UI strings |
| `scripts/extract-i18n.mjs` | **Modify** — mirror the new keys into `MANUAL_KEYS` |
| `e2e/smoke.spec.ts` | **Modify** — navigation and RTL coverage for the new pages |
| `README.md` | **Modify** — document the collection and the slug map |

---

### Task 1: Collection schema, taxonomy helper, and tests

Establishes the data contract. No pages yet, no copy yet — just the schema, the pure functions later tasks depend on, and their tests.

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/lib/services.ts`
- Create: `tests/services.test.ts`
- Modify: `package.json` (add `yaml` devDependency, used by Task 6's integrity test)

**Interfaces:**
- Consumes: nothing (first task)
- Produces:
  - `type ServiceKind = 'pillar' | 'leaf'`
  - `type ServiceProject = 'farblieferant' | 'phpmorocco' | 'marrakechphp'`
  - `type ServiceItem = { title: string; description: string }`
  - `type ServiceData = { slug: string; lang: string; kind: ServiceKind; pillar: string; order: number; number?: string; title: string; lead: string; included?: ServiceItem[]; steps?: ServiceItem[]; engagement: { model: string; drivers: string }; faq: { q: string; a: string }[]; project?: ServiceProject }`
  - `getPillars(all: ServiceData[]): ServiceData[]`
  - `getChildren(all: ServiceData[], pillarSlug: string): ServiceData[]`
  - `getSiblings(all: ServiceData[], slug: string): ServiceData[]`
  - `getParent(all: ServiceData[], slug: string): ServiceData | undefined`
  - All functions are pure and take the already-locale-filtered array; the route filters by locale before calling.

- [ ] **Step 1: Add the `yaml` devDependency**

`yaml` is currently only present transitively via Astro. Task 6's content-integrity test parses frontmatter with it, so declare it explicitly rather than relying on hoisting.

```bash
npm install --save-dev yaml
```

- [ ] **Step 2: Write the failing test**

Create `tests/services.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getChildren, getParent, getPillars, getSiblings, type ServiceData } from '../src/lib/services';

const base = {
  lang: 'fr',
  lead: 'lead',
  engagement: { model: 'm', drivers: 'd' },
  faq: [{ q: 'q', a: 'a' }, { q: 'q2', a: 'a2' }],
};

const pillar = (slug: string, order: number, number: string): ServiceData =>
  ({ ...base, slug, kind: 'pillar', pillar: slug, order, number, title: slug } as ServiceData);

const leaf = (slug: string, pillarSlug: string, order: number): ServiceData =>
  ({
    ...base, slug, kind: 'leaf', pillar: pillarSlug, order, title: slug,
    included: [{ title: 'i', description: 'd' }],
    steps: [{ title: 's', description: 'd' }],
  } as ServiceData);

const all: ServiceData[] = [
  pillar('design', 2, '02'),
  pillar('developpement', 1, '01'),
  leaf('ux-ui-design', 'design', 1),
  leaf('branding-identite', 'design', 2),
  leaf('applications-mobiles', 'developpement', 2),
  leaf('applications-web-saas', 'developpement', 1),
];

describe('getPillars', () => {
  it('returns only pillars, sorted by order', () => {
    expect(getPillars(all).map((p) => p.slug)).toEqual(['developpement', 'design']);
  });
});

describe('getChildren', () => {
  it('returns the pillar leaves sorted by order', () => {
    expect(getChildren(all, 'developpement').map((c) => c.slug))
      .toEqual(['applications-web-saas', 'applications-mobiles']);
  });
  it('never includes the pillar itself', () => {
    expect(getChildren(all, 'design').every((c) => c.kind === 'leaf')).toBe(true);
  });
  it('returns an empty array for an unknown pillar', () => {
    expect(getChildren(all, 'nope')).toEqual([]);
  });
});

describe('getSiblings', () => {
  it('excludes the current page and never crosses pillars', () => {
    const siblings = getSiblings(all, 'ux-ui-design');
    expect(siblings.map((s) => s.slug)).toEqual(['branding-identite']);
  });
  it('returns an empty array for a pillar slug', () => {
    expect(getSiblings(all, 'design')).toEqual([]);
  });
});

describe('getParent', () => {
  it('resolves a leaf to its pillar', () => {
    expect(getParent(all, 'applications-mobiles')?.slug).toBe('developpement');
  });
  it('returns undefined for an unknown slug', () => {
    expect(getParent(all, 'nope')).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run tests/services.test.ts`
Expected: FAIL — cannot resolve `../src/lib/services`.

- [ ] **Step 4: Write the helper**

Create `src/lib/services.ts`:

```ts
export type ServiceKind = 'pillar' | 'leaf';
export type ServiceProject = 'farblieferant' | 'phpmorocco' | 'marrakechphp';
export type ServiceItem = { title: string; description: string };

export type ServiceData = {
  slug: string;
  lang: string;
  kind: ServiceKind;
  pillar: string;
  order: number;
  number?: string;
  title: string;
  lead: string;
  included?: ServiceItem[];
  steps?: ServiceItem[];
  engagement: { model: string; drivers: string };
  faq: { q: string; a: string }[];
  project?: ServiceProject;
};

const byOrder = (a: ServiceData, b: ServiceData) => a.order - b.order;

export function getPillars(all: ServiceData[]): ServiceData[] {
  return all.filter((s) => s.kind === 'pillar').sort(byOrder);
}

export function getChildren(all: ServiceData[], pillarSlug: string): ServiceData[] {
  return all.filter((s) => s.kind === 'leaf' && s.pillar === pillarSlug).sort(byOrder);
}

export function getSiblings(all: ServiceData[], slug: string): ServiceData[] {
  const self = all.find((s) => s.slug === slug);
  if (!self || self.kind !== 'leaf') return [];
  return getChildren(all, self.pillar).filter((s) => s.slug !== slug);
}

export function getParent(all: ServiceData[], slug: string): ServiceData | undefined {
  const self = all.find((s) => s.slug === slug);
  if (!self || self.kind !== 'leaf') return undefined;
  return all.find((s) => s.kind === 'pillar' && s.slug === self.pillar);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/services.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Add the collection schema**

In `src/content.config.ts`, add above the `export const collections` line:

```ts
const serviceItem = z.object({ title: z.string(), description: z.string() });

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z
    .object({
      slug: z.string(),
      lang: z.enum(['fr', 'en', 'ar']),
      kind: z.enum(['pillar', 'leaf']),
      pillar: z.string(),
      order: z.number(),
      number: z.string().optional(),
      title: z.string(),
      lead: z.string(),
      included: z.array(serviceItem).optional(),
      steps: z.array(serviceItem).optional(),
      engagement: z.object({ model: z.string(), drivers: z.string() }),
      faq: z.array(z.object({ q: z.string(), a: z.string() })).min(2),
      project: z.enum(['farblieferant', 'phpmorocco', 'marrakechphp']).optional(),
    })
    .superRefine((d, ctx) => {
      if (d.kind === 'leaf') {
        if (!d.included?.length) ctx.addIssue({ code: 'custom', message: `${d.slug}.${d.lang}: leaf requires a non-empty included[]` });
        if (!d.steps?.length) ctx.addIssue({ code: 'custom', message: `${d.slug}.${d.lang}: leaf requires a non-empty steps[]` });
      } else {
        if (d.included || d.steps) ctx.addIssue({ code: 'custom', message: `${d.slug}.${d.lang}: pillar must not define included/steps` });
        if (!d.number) ctx.addIssue({ code: 'custom', message: `${d.slug}.${d.lang}: pillar requires number` });
      }
    }),
});
```

Then change the export to:

```ts
export const collections = { caseStudies, blog, services };
```

- [ ] **Step 7: Verify the schema compiles**

Run: `npm run check`
Expected: 0 errors. (The collection is empty at this point; that is valid.)

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/content.config.ts src/lib/services.ts tests/services.test.ts
git commit -m "Add services collection schema and taxonomy helper with tests"
```

---

### Task 2: Route template, UI strings, and the first three services

Builds the page template and proves it against real copy. **Ends at the review checkpoint** — the user reviews these three pages before the remaining 51 files are written.

**Files:**
- Create: `src/components/ServiceCard.astro`
- Create: `src/pages/[lang]/services/[slug].astro`
- Create: `src/content/services/developpement.{fr,en,ar}.md`
- Create: `src/content/services/applications-web-saas.{fr,en,ar}.md`
- Create: `src/content/services/e-commerce.{fr,en,ar}.md`
- Modify: `src/i18n/{fr,en,ar}.json`
- Modify: `scripts/extract-i18n.mjs`

**Interfaces:**
- Consumes: `getPillars`, `getChildren`, `getSiblings`, `getParent`, `ServiceData` from `src/lib/services.ts` (Task 1)
- Produces:
  - `ServiceCard.astro` props: `{ lang: Locale; slug: string; title: string; lead: string }`
  - Route `src/pages/[lang]/services/[slug].astro` generating one page per `(lang, slug)` pair
  - i18n keys later tasks rely on: `service.back`, `service.problem_h`, `service.included_h`, `service.steps_h`, `service.case_h`, `service.case_link`, `service.engagement_h`, `service.engagement_drivers_h`, `service.engagement_cta`, `service.faq_h`, `service.related_h`, `service.children_h`

- [ ] **Step 1: Add the `service.*` UI strings**

Add to `src/i18n/fr.json`:

```json
"service.back": "← Tous les services",
"service.problem_h": "Le problème",
"service.included_h": "Ce qui est inclus",
"service.steps_h": "Comment nous travaillons",
"service.case_h": "En pratique",
"service.case_link": "Voir le projet →",
"service.engagement_h": "Investissement",
"service.engagement_drivers_h": "Ce qui fait varier le budget",
"service.engagement_cta": "Demander un devis",
"service.faq_h": "Questions fréquentes",
"service.related_h": "Services liés",
"service.children_h": "Ce que couvre ce métier"
```

Add to `src/i18n/en.json`:

```json
"service.back": "← All services",
"service.problem_h": "The problem",
"service.included_h": "What's included",
"service.steps_h": "How we work",
"service.case_h": "In practice",
"service.case_link": "View the project →",
"service.engagement_h": "Investment",
"service.engagement_drivers_h": "What moves the budget",
"service.engagement_cta": "Request a quote",
"service.faq_h": "Frequently asked questions",
"service.related_h": "Related services",
"service.children_h": "What this discipline covers"
```

Add to `src/i18n/ar.json`:

```json
"service.back": "← جميع الخدمات",
"service.problem_h": "المشكلة",
"service.included_h": "ما يشمله العمل",
"service.steps_h": "كيف نعمل",
"service.case_h": "على أرض الواقع",
"service.case_link": "اطّلع على المشروع →",
"service.engagement_h": "الاستثمار",
"service.engagement_drivers_h": "ما يؤثّر في الميزانية",
"service.engagement_cta": "اطلب عرض سعر",
"service.faq_h": "أسئلة متكرّرة",
"service.related_h": "خدمات ذات صلة",
"service.children_h": "ما يغطّيه هذا المجال"
```

Note the `←` in `service.back` is kept as-is for `ar`; the RTL context flips its visual side automatically.

- [ ] **Step 2: Mirror the keys into `MANUAL_KEYS`**

In `scripts/extract-i18n.mjs`, append the same 12 keys to each of the `fr`, `en`, `ar` blocks in `MANUAL_KEYS`, using the exact values from Step 1. Verify with:

```bash
node --check scripts/extract-i18n.mjs
```

- [ ] **Step 3: Create `ServiceCard.astro`**

```astro
---
import { localePath, type Locale } from '../i18n';

interface Props { lang: Locale; slug: string; title: string; lead: string }
const { lang, slug, title, lead } = Astro.props;
---
<a
  href={localePath(lang, `/services/${slug}`)}
  class="group flex flex-col rounded-card border border-line bg-card p-7 transition-colors hover:border-ink"
>
  <div class="text-[18px] font-bold tracking-[-0.01em]">{title}</div>
  <p class="m-0 mt-3 text-[15px] leading-[1.6] text-txt-2">{lead}</p>
</a>
```

- [ ] **Step 4: Create the route**

Create `src/pages/[lang]/services/[slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import Kicker from '../../../components/Kicker.astro';
import ServiceCard from '../../../components/ServiceCard.astro';
import Screenshot from '../../../components/Screenshot.astro';
import fbCard from '../../../assets/farblieferant-card.png';
import phpCard from '../../../assets/phpmorocco-card.png';
import mphpCard from '../../../assets/marrakechphp-card.png';
import { t, localePath, type Locale } from '../../../i18n';
import { getChildren, getParent, getSiblings, type ServiceData } from '../../../lib/services';

export async function getStaticPaths() {
  const entries = await getCollection('services');
  return entries.map((entry) => ({
    params: { lang: entry.data.lang, slug: entry.data.slug },
    props: { entryId: entry.id },
  }));
}

const lang = Astro.params.lang as Locale;
const { entryId } = Astro.props as { entryId: string };

const all = await getCollection('services', (e) => e.data.lang === lang);
const entry = all.find((e) => e.id === entryId)!;
const data = entry.data as ServiceData;
const allData = all.map((e) => e.data as ServiceData);
const { Content } = await render(entry);

const parent = getParent(allData, data.slug);
const siblings = getSiblings(allData, data.slug);
const children = data.kind === 'pillar' ? getChildren(allData, data.slug) : [];

const projects = {
  farblieferant: { img: fbCard, href: '/portfolio/farblieferant', name: 'Farblieferant' },
  phpmorocco: { img: phpCard, href: '/portfolio', name: 'PHP Morocco' },
  marrakechphp: { img: mphpCard, href: '/portfolio', name: 'Marrakech PHP' },
} as const;
const project = data.project ? projects[data.project] : null;
const projectAlt = data.project === 'farblieferant' ? 'img.fb_card'
  : data.project === 'phpmorocco' ? 'img.php_card' : 'img.mphp_card';

const title = `${data.title} — MAKRAZ`;
---
<Base lang={lang} path={`/services/${data.slug}`} title={title} description={data.lead} active="services" ctaPage="services">
  <!-- Hero -->
  <section class="mk-container pb-14 pt-[90px]">
    <a href={localePath(lang, '/services')} class="text-[14px] font-semibold text-txt-4 hover:text-ink">{t(lang, 'service.back')}</a>
    <Kicker class="mb-5 mt-9">{data.kind === 'pillar' ? `${data.number} · ${data.title}` : parent?.title ?? ''}</Kicker>
    <h1 class="text-h1 m-0 max-w-[18ch]">{data.title}</h1>
    <p class="mt-[26px] max-w-[58ch] text-[19px] leading-[1.6] text-txt-2">{data.lead}</p>
  </section>

  <!-- Le problème -->
  <section class="border-t border-line bg-card">
    <div class="mk-container mk-section mx-auto max-w-[840px]">
      <h2 class="text-h2-sub m-0 mb-6">{t(lang, 'service.problem_h')}</h2>
      <div class="[&_p]:m-0 [&_p+p]:mt-6 [&_p]:text-[17px] [&_p]:leading-[1.75] [&_p]:text-[#3a3a3a]">
        <Content />
      </div>
    </div>
  </section>

  {children.length > 0 && (
    <section class="border-t border-line">
      <div class="mk-container mk-section">
        <h2 class="text-h2-sub m-0 mb-10">{t(lang, 'service.children_h')}</h2>
        <div class="grid grid-cols-3 gap-7 max-[900px]:grid-cols-1">
          {children.map((c) => <ServiceCard lang={lang} slug={c.slug} title={c.title} lead={c.lead} />)}
        </div>
      </div>
    </section>
  )}

  {data.included && data.included.length > 0 && (
    <section class="border-t border-line">
      <div class="mk-container mk-section">
        <h2 class="text-h2-sub m-0 mb-8">{t(lang, 'service.included_h')}</h2>
        <div class="border-t border-line">
          {data.included.map((item, i) => (
            <div class:list={['grid grid-cols-[260px_1fr] gap-6 py-[26px] max-[900px]:grid-cols-1', i < data.included!.length - 1 && 'border-b border-line']}>
              <div class="text-[17px] font-bold">{item.title}</div>
              <p class="m-0 text-[15px] leading-[1.6] text-txt-2">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )}

  {data.steps && data.steps.length > 0 && (
    <section class="border-t border-line bg-card">
      <div class="mk-container mk-section">
        <h2 class="text-h2-sub m-0 mb-10">{t(lang, 'service.steps_h')}</h2>
        <div class="grid grid-cols-4 gap-7 max-[900px]:grid-cols-1">
          {data.steps.map((step, i) => (
            <div>
              <div class="text-kicker mb-4">{String(i + 1).padStart(2, '0')}</div>
              <div class="text-[17px] font-bold">{step.title}</div>
              <p class="m-0 mt-3 text-[15px] leading-[1.6] text-txt-2">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )}

  {project && (
    <section class="border-t border-line">
      <div class="mk-container mk-section grid grid-cols-[1.25fr_1fr] items-center gap-16 max-[900px]:grid-cols-1">
        <Screenshot src={project.img} alt={t(lang, projectAlt)} ratio="16/11" radius="media" sizes="(max-width: 900px) 100vw, 690px" />
        <div>
          <h2 class="text-h2-sub m-0 mb-4">{t(lang, 'service.case_h')}</h2>
          <div class="text-[19px] font-bold">{project.name}</div>
          <a href={localePath(lang, project.href)} class="mt-6 inline-block border-b-2 border-ink pb-[3px] text-[16px] font-semibold">{t(lang, 'service.case_link')}</a>
        </div>
      </div>
    </section>
  )}

  <!-- Investissement -->
  <section class="border-t border-line bg-card">
    <div class="mk-container mk-section mx-auto max-w-[840px]">
      <h2 class="text-h2-sub m-0 mb-6">{t(lang, 'service.engagement_h')}</h2>
      <p class="m-0 text-[17px] leading-[1.75] text-[#3a3a3a]">{data.engagement.model}</p>
      <div class="mt-8 border-t border-line pt-6">
        <div class="text-kicker mb-3">{t(lang, 'service.engagement_drivers_h')}</div>
        <p class="m-0 text-[16px] leading-[1.7] text-txt-2">{data.engagement.drivers}</p>
      </div>
      <a href={localePath(lang, '/contact')} class="btn btn-primary mt-9">{t(lang, 'service.engagement_cta')}</a>
    </div>
  </section>

  <!-- FAQ -->
  <section class="border-t border-line">
    <div class="mk-container mk-section mx-auto max-w-[840px]">
      <h2 class="text-h2-sub m-0 mb-8">{t(lang, 'service.faq_h')}</h2>
      <div class="border-t border-line">
        {data.faq.map((item) => (
          <details class="border-b border-line">
            <summary class="cursor-pointer py-[22px] text-[17px] font-bold">{item.q}</summary>
            <p class="m-0 pb-6 text-[15px] leading-[1.65] text-txt-2">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>

  {siblings.length > 0 && (
    <section class="border-t border-line bg-card">
      <div class="mk-container mk-section">
        <h2 class="text-h2-sub m-0 mb-10">{t(lang, 'service.related_h')}</h2>
        <div class="grid grid-cols-3 gap-7 max-[900px]:grid-cols-1">
          {siblings.map((s) => <ServiceCard lang={lang} slug={s.slug} title={s.title} lead={s.lead} />)}
        </div>
      </div>
    </section>
  )}
</Base>
```

Note: unlike the other routes, `getStaticPaths` here derives languages from the collection rather than from `locales`, so a service missing a locale yields no page instead of a page with no content. Task 6's parity test is what catches that omission.

- [ ] **Step 5: Write `developpement.fr.md` (pillar)**

Create `src/content/services/developpement.fr.md`:

```markdown
---
slug: developpement
lang: fr
kind: pillar
pillar: developpement
order: 1
number: "01"
title: Développement
lead: Applications web et SaaS, applications mobiles, sites, e-commerce, API et intégrations — construits avec une rigueur d'ingénierie européenne, depuis Marrakech.
engagement:
  model: Le développement se contractualise au forfait sur un périmètre cadré : nous chiffrons après un appel découverte et un cadrage écrit, et le montant ne bouge pas sans décision explicite de votre part. Les chantiers longs sont découpés en jalons livrés et facturés un par un.
  drivers: Le nombre d'écrans et de rôles utilisateurs, les intégrations avec vos outils existants, les exigences de conformité et de sécurité, et le niveau d'exigence sur le design et les animations.
faq:
  - q: Travaillez-vous avec des équipes techniques déjà en place ?
    a: Oui. Nous intervenons aussi bien sur un produit à créer que sur une base de code existante, en renfort d'une équipe interne ou en reprise d'un projet livré par un tiers.
  - q: À qui appartient le code ?
    a: À vous, intégralement, dès le premier jour. Le dépôt est chez vous ou vous est transféré à la livraison, avec la documentation et les accès d'infrastructure.
  - q: Que se passe-t-il après la mise en production ?
    a: Rien ne s'arrête à la livraison. Nous restons disponibles pour la maintenance, les correctifs et les évolutions, sous forme d'un accompagnement mensuel ou à la demande.
---

La plupart des logiciels qui échouent ne tombent pas en panne : ils deviennent trop coûteux à faire évoluer. Une fonctionnalité qui prenait trois jours en prend trois semaines, chaque correctif en casse un autre, et l'équipe finit par proposer une réécriture complète — vingt-quatre mois après un lancement réussi.

Ce n'est presque jamais un problème de langage ou de framework. C'est un problème de décisions prises tôt, sous pression, sans que personne ait à en assumer les conséquences dix-huit mois plus tard. Nous construisons dans l'autre sens : des fondations lisibles, testées et documentées, pour que le coût d'un changement reste stable dans le temps.
```

- [ ] **Step 6: Write `developpement.en.md` and `developpement.ar.md`**

Same frontmatter shape and `order`/`number`/`kind`/`pillar` values, with `lang: en` / `lang: ar` and all prose translated. Do not leave French text in either file.

- [ ] **Step 7: Write `applications-web-saas.{fr,en,ar}.md` (leaf, no project)**

`fr` version:

```markdown
---
slug: applications-web-saas
lang: fr
kind: leaf
pillar: developpement
order: 1
title: Applications web & SaaS
lead: Des plateformes métier et des produits SaaS pensés pour être exploités des années, pas pour passer une démo.
included:
  - title: Cadrage produit
    description: Traduction de votre besoin métier en périmètre livrable, priorisé par valeur et par risque, avec ce qui est explicitement hors périmètre.
  - title: Architecture applicative
    description: Modèle de données, découpage des responsabilités et choix d'hébergement, documentés pour être repris par une autre équipe que la nôtre.
  - title: Développement itératif
    description: Livraisons régulières sur un environnement de recette accessible, pour que vous validiez en continu plutôt qu'à la fin.
  - title: Comptes, rôles et permissions
    description: Authentification, gestion des utilisateurs et droits différenciés — la partie la plus souvent sous-estimée dans les outils métier.
  - title: Tests automatisés
    description: Couverture des parcours critiques, pour qu'une évolution ne casse pas silencieusement ce qui fonctionnait la veille.
  - title: Mise en production et transfert
    description: Déploiement, supervision, documentation et passation des accès — vous restez autonome même sans nous.
steps:
  - title: Découverte
    description: Un appel pour comprendre le métier, les contraintes et ce qui doit être vrai pour que le projet soit un succès.
  - title: Cadrage
    description: Périmètre écrit, jalons et budget forfaitaire. Vous validez avant qu'une ligne de code soit écrite.
  - title: Construction
    description: Développement par itérations avec démonstrations régulières et un environnement de test à votre disposition.
  - title: Exploitation
    description: Mise en production, mesure, corrections et évolutions selon vos priorités.
engagement:
  model: Projet cadré au forfait, découpé en jalons livrés et facturés séparément. Le devis est établi après un appel découverte gratuit et un cadrage écrit.
  drivers: Le nombre d'écrans et de rôles, la complexité des règles métier, les intégrations avec vos systèmes existants et le niveau d'exigence sur l'interface.
faq:
  - q: Combien de temps avant une première version utilisable ?
    a: Sur un périmètre resserré, quelques semaines suffisent pour une première version que vos utilisateurs peuvent réellement essayer. C'est volontaire : une version en usage réel apprend plus que six mois de spécifications.
  - q: Pouvez-vous reprendre une application existante ?
    a: Oui. Nous commençons par un audit du code et de l'infrastructure, puis nous proposons soit une reprise progressive, soit une réécriture ciblée des parties qui coûtent le plus cher à maintenir.
  - q: Comment gérez-vous les changements de périmètre en cours de route ?
    a: Ils sont normaux. Chaque demande est chiffrée séparément et vous décidez de la faire entrer dans le jalon en cours, dans un jalon suivant, ou pas du tout.
---

Un outil métier commence presque toujours par un tableur qui fonctionne — jusqu'au jour où trois personnes le modifient en même temps, où personne ne sait quelle version fait foi, et où une erreur de saisie coûte une journée de production.

Le réflexe est alors de commander « la même chose, mais en application ». C'est rarement la bonne réponse : ce qui doit être conçu, ce n'est pas le tableur, c'est le processus. Nous partons du travail réel — qui saisit quoi, qui valide, ce qui doit être tracé — pour construire une plateforme qui remplace le tableur sans reproduire ses angles morts.
```

Then the `en` and `ar` versions with identical structure and translated content.

- [ ] **Step 8: Write `e-commerce.{fr,en,ar}.md` (leaf, with project)**

Identical structure to Step 7 with `order: 4`, `pillar: developpement`, and — this is the only difference in shape — `project: farblieferant` in the frontmatter. Copy must describe e-commerce work (catalogue, payment, logistics, recurring professional orders) without naming any technology used on the client's platform.

- [ ] **Step 9: Build and verify the three pages render**

```bash
rm -rf dist && npm run build
ls dist/client/fr/services/ dist/client/ar/services/
grep -o '<title>[^<]*</title>' dist/client/en/services/applications-web-saas/index.html
```

Expected: `developpement`, `applications-web-saas` and `e-commerce` directories in all three locales; 9 new pages; the EN title reads `Web apps & SaaS — MAKRAZ` (or the exact EN `title` you wrote).

- [ ] **Step 10: Run the full check and test suite**

```bash
npm run check && npm test
```
Expected: 0 errors; all tests pass including Task 1's 8 new ones.

- [ ] **Step 11: Visual verification under `wrangler dev`**

```bash
npm run build && npx wrangler dev --port 4340 &
```

Check at desktop (1440px) and mobile (390px) widths:
- `http://localhost:4340/fr/services/applications-web-saas`
- `http://localhost:4340/ar/services/applications-web-saas` — confirm RTL: the numbered steps read right-to-left and the sibling grid mirrors
- `http://localhost:4340/fr/services/developpement` — confirm the children grid shows only the leaves that exist so far
- `http://localhost:4340/fr/services/e-commerce` — confirm the case-study block shows the Farblieferant screenshot

Kill the server when done.

- [ ] **Step 12: Commit**

```bash
git add src/components/ServiceCard.astro "src/pages/[lang]/services/[slug].astro" src/content/services src/i18n scripts/extract-i18n.mjs
git commit -m "Add service page template with the first three services"
```

- [ ] **Step 13: STOP — review checkpoint**

Present the three pages to the user and ask for approval of voice, structure and section order **before** writing the remaining 51 files. Do not continue to Task 3 without it. This is the cheap moment to redirect the copy.

---

### Task 3: Remaining Développement leaves

**Files:**
- Create: `src/content/services/applications-mobiles.{fr,en,ar}.md` (`order: 2`)
- Create: `src/content/services/sites-internet.{fr,en,ar}.md` (`order: 3`, `project: phpmorocco`)
- Create: `src/content/services/mvp-lancement-rapide.{fr,en,ar}.md` (`order: 5`)
- Create: `src/content/services/api-integrations.{fr,en,ar}.md` (`order: 6`)
- Create: `src/content/services/devops-cloud.{fr,en,ar}.md` (`order: 7`)
- Create: `src/content/services/maintenance-optimisation.{fr,en,ar}.md` (`order: 8`)

**Interfaces:**
- Consumes: the frontmatter contract from Task 1's schema and the file shape established in Task 2 Step 7
- Produces: 18 content files; no code changes

- [ ] **Step 1: Write the six FR files**

All with `kind: leaf`, `pillar: developpement`, the `order` values listed above, 4–6 `included` entries, 3–4 `steps`, an `engagement` block, and 2–3 `faq` entries.

Each markdown body opens on a distinct concrete failure mode — required by the spec, and the thing that stops 17 pages reading as filler. Use these angles:

| Slug | Failure mode to open on |
|---|---|
| `applications-mobiles` | An app that works in the simulator, then stalls for weeks in store review over permissions and privacy declarations |
| `sites-internet` | A site that looks good in the mockup and loads in six seconds on a mid-range Android over 4G |
| `mvp-lancement-rapide` | An "MVP" that grew into eleven months of building before a single user saw it |
| `api-integrations` | Two systems kept in sync by a nightly export that nobody notices has been failing for a week |
| `devops-cloud` | A deploy only one person knows how to run, on a Friday, by hand |
| `maintenance-optimisation` | A platform nobody has touched in a year, now three major versions behind with a known vulnerability |

Only `sites-internet` carries `project: phpmorocco`. The other five have no `project` key.

- [ ] **Step 2: Write the matching EN and AR files**

Twelve files, identical frontmatter structure, fully translated. No French left in any `en`/`ar` file.

- [ ] **Step 3: Verify schema and parity**

```bash
npm run check && npm run build
ls dist/client/fr/services | wc -l   # expect 9 (developpement + 8 leaves)
ls dist/client/ar/services | wc -l   # expect 9
```

- [ ] **Step 4: Commit**

```bash
git add src/content/services
git commit -m "Add the remaining Developpement service pages in three locales"
```

---

### Task 4: Design pillar and leaves

**Files:**
- Create: `src/content/services/design.{fr,en,ar}.md` (`kind: pillar`, `order: 2`, `number: "02"`)
- Create: `src/content/services/ux-ui-design.{fr,en,ar}.md` (`order: 1`)
- Create: `src/content/services/branding-identite.{fr,en,ar}.md` (`order: 2`)
- Create: `src/content/services/motion-contenu-visuel.{fr,en,ar}.md` (`order: 3`)

**Interfaces:**
- Consumes: the same frontmatter contract; pillar files must omit `included`/`steps` and include `number`
- Produces: 12 content files

- [ ] **Step 1: Write the four FR files**

`pillar: design` on all four. Opening failure modes:

| Slug | Failure mode to open on |
|---|---|
| `design` (pillar) | A product that does everything it promised and still feels untrustworthy to a first-time visitor |
| `ux-ui-design` | A feature built exactly to spec that users never find, because nobody mapped the path to it |
| `branding-identite` | A logo chosen in an afternoon that then has to work on an invoice, a van and a 32-pixel favicon |
| `motion-contenu-visuel` | A launch with nothing to show for it — no visuals a journalist or a prospect could reuse |

- [ ] **Step 2: Write the matching EN and AR files**

- [ ] **Step 3: Verify**

```bash
npm run check && npm run build
ls dist/client/fr/services | wc -l   # expect 13
```

- [ ] **Step 4: Commit**

```bash
git add src/content/services
git commit -m "Add Design service pages in three locales"
```

---

### Task 5: Communication pillar and leaves

**Files:**
- Create: `src/content/services/communication.{fr,en,ar}.md` (`kind: pillar`, `order: 3`, `number: "03"`)
- Create: `src/content/services/referencement-naturel-seo.{fr,en,ar}.md` (`order: 1`)
- Create: `src/content/services/publicite-en-ligne-sea.{fr,en,ar}.md` (`order: 2`)
- Create: `src/content/services/reseaux-sociaux.{fr,en,ar}.md` (`order: 3`, `project: marrakechphp`)
- Create: `src/content/services/strategie-digitale.{fr,en,ar}.md` (`order: 4`)
- Create: `src/content/services/contenu-copywriting.{fr,en,ar}.md` (`order: 5`)
- Create: `src/content/services/conseil-accompagnement.{fr,en,ar}.md` (`order: 6`)

**Interfaces:**
- Consumes: the same frontmatter contract
- Produces: 21 content files, completing all 60

- [ ] **Step 1: Write the seven FR files**

`pillar: communication` on all seven. Opening failure modes:

| Slug | Failure mode to open on |
|---|---|
| `communication` (pillar) | A good product nobody knows exists — invisible is indistinguishable from non-existent |
| `referencement-naturel-seo` | SEO treated as a post-launch task on a site whose architecture already forbids it |
| `publicite-en-ligne-sea` | A budget spent on clicks that land on a page which converts nobody |
| `reseaux-sociaux` | An account posting weekly to an audience that was never the buyer |
| `strategie-digitale` | Five channels run in parallel with no agreement on what success means |
| `contenu-copywriting` | Copy written by whoever had time, in a voice that changes on every page |
| `conseil-accompagnement` | A decision between two platforms, made by whoever spoke last |

Only `reseaux-sociaux` carries `project: marrakechphp`.

- [ ] **Step 2: Write the matching EN and AR files**

- [ ] **Step 3: Verify the full set**

```bash
ls src/content/services | wc -l      # expect 60
npm run check && npm run build
ls dist/client/fr/services | wc -l   # expect 20
ls dist/client/en/services | wc -l   # expect 20
ls dist/client/ar/services | wc -l   # expect 20
```

- [ ] **Step 4: Commit**

```bash
git add src/content/services
git commit -m "Add Communication service pages in three locales"
```

---

### Task 6: Content integrity tests

Now that all 60 files exist, lock the invariants so a future edit cannot silently break parity or orphan a leaf.

**Files:**
- Create: `tests/services-content.test.ts`

**Interfaces:**
- Consumes: `yaml` (Task 1 Step 1), the 60 files from Tasks 2–5
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Write the failing test**

Create `tests/services-content.test.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const DIR = join(process.cwd(), 'src/content/services');
const LOCALES = ['fr', 'en', 'ar'] as const;
const PROJECTS = ['farblieferant', 'phpmorocco', 'marrakechphp'];

type Front = Record<string, any>;

const files = readdirSync(DIR).filter((f) => f.endsWith('.md'));

function frontmatter(file: string): Front {
  const raw = readFileSync(join(DIR, file), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: no frontmatter`);
  return { ...parse(m[1]), __body: m[2].trim() };
}

const all = files.map((f) => ({ file: f, data: frontmatter(f) }));

describe('service content', () => {
  it('has 60 files', () => expect(files.length).toBe(60));

  it('exists in all three locales for every slug', () => {
    const bySlug = new Map<string, Set<string>>();
    for (const { data } of all) {
      if (!bySlug.has(data.slug)) bySlug.set(data.slug, new Set());
      bySlug.get(data.slug)!.add(data.lang);
    }
    expect(bySlug.size).toBe(20);
    for (const [slug, langs] of bySlug) {
      expect([...langs].sort(), `${slug} locales`).toEqual([...LOCALES].sort());
    }
  });

  it('names the file after its slug and lang', () => {
    for (const { file, data } of all) expect(file).toBe(`${data.slug}.${data.lang}.md`);
  });

  it('resolves every leaf pillar to an existing pillar', () => {
    const pillars = new Set(all.filter((e) => e.data.kind === 'pillar').map((e) => e.data.slug));
    for (const { file, data } of all) {
      if (data.kind === 'leaf') expect(pillars.has(data.pillar), `${file} pillar`).toBe(true);
    }
  });

  it('has 8 / 3 / 6 leaves per pillar in each locale', () => {
    const expected: Record<string, number> = { developpement: 8, design: 3, communication: 6 };
    for (const lang of LOCALES) {
      for (const [pillar, count] of Object.entries(expected)) {
        const leaves = all.filter((e) => e.data.lang === lang && e.data.kind === 'leaf' && e.data.pillar === pillar);
        expect(leaves.length, `${lang}/${pillar}`).toBe(count);
        expect(new Set(leaves.map((l) => l.data.order)).size, `${lang}/${pillar} unique order`).toBe(count);
      }
    }
  });

  it('gives leaves non-empty included, steps, faq and engagement', () => {
    for (const { file, data } of all.filter((e) => e.data.kind === 'leaf')) {
      expect(data.included?.length, `${file} included`).toBeGreaterThan(3);
      expect(data.steps?.length, `${file} steps`).toBeGreaterThan(2);
      expect(data.faq?.length, `${file} faq`).toBeGreaterThan(1);
      expect(data.engagement?.model?.length, `${file} engagement.model`).toBeGreaterThan(20);
      expect(data.engagement?.drivers?.length, `${file} engagement.drivers`).toBeGreaterThan(20);
      expect(data.__body.length, `${file} body`).toBeGreaterThan(200);
    }
  });

  it('gives pillars a number and no included/steps', () => {
    for (const { file, data } of all.filter((e) => e.data.kind === 'pillar')) {
      expect(data.number, `${file} number`).toMatch(/^0[123]$/);
      expect(data.included, `${file} included`).toBeUndefined();
      expect(data.steps, `${file} steps`).toBeUndefined();
    }
  });

  it('only uses known project values, on the three mapped services', () => {
    const mapped: Record<string, string> = {
      'e-commerce': 'farblieferant',
      'sites-internet': 'phpmorocco',
      'reseaux-sociaux': 'marrakechphp',
    };
    for (const { file, data } of all) {
      if (data.project) {
        expect(PROJECTS, `${file} project value`).toContain(data.project);
        expect(mapped[data.slug], `${file} unexpected project mapping`).toBe(data.project);
      } else {
        expect(mapped[data.slug], `${file} missing expected project`).toBeUndefined();
      }
    }
  });

  it('contains no placeholder markers and no pricing figures', () => {
    for (const { file } of all) {
      const raw = readFileSync(join(DIR, file), 'utf8');
      expect(raw, `${file} placeholder`).not.toMatch(/\[(à valider|to confirm|à compléter|TBD|TODO)/i);
      expect(raw, `${file} price`).not.toMatch(/\d+\s?(€|MAD|EUR|USD|\$|DH)/);
    }
  });

  it('leaves no French copy in the en and ar files', () => {
    for (const { file, data } of all.filter((e) => e.data.lang !== 'fr')) {
      const fr = all.find((e) => e.data.slug === data.slug && e.data.lang === 'fr')!;
      expect(data.lead, `${file} lead duplicates FR`).not.toBe(fr.data.lead);
      expect(data.__body, `${file} body duplicates FR`).not.toBe(fr.data.__body);
    }
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run tests/services-content.test.ts`
Expected: PASS. Any failure is a real content defect — fix the `.md` file, not the test. The most likely genuine failures are a missing locale, a duplicate `order`, or an `en`/`ar` file left holding French text.

- [ ] **Step 3: Commit**

```bash
git add tests/services-content.test.ts
git commit -m "Add content integrity tests for the services collection"
```

---

### Task 7: Link the hub page

**Files:**
- Modify: `src/pages/[lang]/services.astro`

**Interfaces:**
- Consumes: `getPillars`, `getChildren` from `src/lib/services.ts`; the 60 files from Tasks 2–5
- Produces: the finished navigation path from `/services` to every page

- [ ] **Step 1: Replace the three hardcoded pillar sections with collection-driven ones**

The current file hardcodes 17 rows as `services.d1_t` … `services.c6_t` i18n keys. Replace the three `<section>` blocks with a loop over the collection so the hub cannot drift from the pages. Add to the frontmatter:

```ts
import { getCollection } from 'astro:content';
import { getChildren, getPillars, type ServiceData } from '../../lib/services';

const all = (await getCollection('services', (e) => e.data.lang === lang)).map((e) => e.data as ServiceData);
const pillars = getPillars(all);
```

Replace the three sections with:

```astro
  {pillars.map((pillar, idx) => (
    <section class:list={['border-t border-line', idx % 2 === 0 && 'bg-card']}>
      <div class="mk-container mk-section flex items-start gap-16 max-[900px]:flex-col">
        <SectionIntro number={pillar.number} title={pillar.title}>
          <p class="m-0 mt-[18px] text-[15px] leading-[1.65] text-txt-2">{pillar.lead}</p>
          <a href={localePath(lang, `/services/${pillar.slug}`)} class="mt-6 inline-block border-b-2 border-ink pb-[3px] text-[15px] font-semibold">{t(lang, 'service.pillar_link')}</a>
        </SectionIntro>
        <div class="min-w-0 flex-1 border-t border-line">
          {getChildren(all, pillar.slug).map((child, i, arr) => (
            <a
              href={localePath(lang, `/services/${child.slug}`)}
              class:list={['group grid grid-cols-[260px_1fr] gap-6 py-[26px] max-[900px]:grid-cols-1', i < arr.length - 1 && 'border-b border-line']}
            >
              <div class="text-[17px] font-bold group-hover:underline">{child.title}</div>
              <p class="m-0 text-[15px] leading-[1.6] text-txt-2">{child.lead}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  ))}
```

`localePath` must be added to the existing `../../i18n` import in this file.

- [ ] **Step 2: Add the `service.pillar_link` key**

Add to all three dictionaries and to `MANUAL_KEYS` in `scripts/extract-i18n.mjs`:

- `fr`: `"service.pillar_link": "Voir le métier en détail →"`
- `en`: `"service.pillar_link": "Explore this discipline →"`
- `ar`: `"service.pillar_link": "استكشف هذا المجال →"`

- [ ] **Step 3: Build and verify every hub row links out**

```bash
rm -rf dist && npm run build
grep -o 'href="/fr/services/[a-z-]*"' dist/client/fr/services/index.html | sort -u | wc -l
```
Expected: 20 (3 pillars + 17 leaves).

- [ ] **Step 4: Confirm the hub still shows all 17 service names and the 3 pillar links**

```bash
grep -c "Voir le métier en détail" dist/client/fr/services/index.html   # expect 3
grep -o 'href="/fr/services/applications-web-saas"' dist/client/fr/services/index.html | wc -l   # expect 1
```

Titles now come from the collection. The `services.d*_t` / `g*_t` / `c*_t` dictionary keys stay — they are extracted from the prototypes and the home page still uses some of them — but they no longer drive this page. Compare the rendered page against the pre-change screenshot to confirm the visual layout is unchanged.

- [ ] **Step 5: Run the suite and commit**

```bash
npm run check && npm test
git add "src/pages/[lang]/services.astro" src/i18n scripts/extract-i18n.mjs
git commit -m "Drive the services hub from the collection and link every service"
```

---

### Task 8: E2E coverage, full verification, deploy

**Files:**
- Modify: `e2e/smoke.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: everything from Tasks 1–7
- Produces: the shipped feature

- [ ] **Step 1: Add the E2E tests**

Append to `e2e/smoke.spec.ts`:

```ts
test('services hub links through to a leaf page', async ({ page }) => {
  await page.goto('/fr/services');
  await page.getByRole('link', { name: /Applications web & SaaS/ }).first().click();
  await expect(page).toHaveURL(/\/fr\/services\/applications-web-saas$/);
  await expect(page.locator('h1')).toHaveText('Applications web & SaaS');
});

test('a pillar page lists its child services', async ({ page }) => {
  await page.goto('/fr/services/developpement');
  const links = page.locator('a[href^="/fr/services/"]');
  expect(await links.count()).toBeGreaterThanOrEqual(8);
});

for (const lang of ['fr', 'en', 'ar']) {
  test(`renders /${lang}/services/e-commerce`, async ({ page }) => {
    const res = await page.goto(`/${lang}/services/e-commerce`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });
}

test('arabic service pages are RTL', async ({ page }) => {
  await page.goto('/ar/services/applications-web-saas');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('service page CTA reaches the contact page', async ({ page }) => {
  await page.goto('/fr/services/applications-web-saas');
  await page.getByRole('link', { name: 'Demander un devis' }).first().click();
  await expect(page).toHaveURL(/\/fr\/contact$/);
});
```

- [ ] **Step 2: Run the E2E suite**

Run: `npm run test:e2e`
Expected: all tests pass — 31 existing plus 8 new.

- [ ] **Step 3: Manual RTL and mobile sweep**

```bash
npm run build && npx wrangler dev --port 4341 &
```

Check, then kill the server:
- `/ar/services/developpement` at 1440px — children grid mirrors, numbered steps read right-to-left
- `/ar/services/e-commerce` at 390px — case-study block stacks, screenshot not distorted
- `/fr/services` at 390px — hub rows are tappable full-width targets

- [ ] **Step 4: Update the README**

Document under the existing "Content collections" line: the `services` collection, the 20-slug map, the pillar/leaf distinction, the three project mappings, and the rule that new UI strings must also go into `MANUAL_KEYS`. Note the constraint that `included`/`steps` are leaf-only.

- [ ] **Step 5: Full verification**

```bash
npm run check && npm test && npm run test:e2e && rm -rf dist && npm run build
grep -rc "_image?href" dist/client/fr/services/e-commerce/index.html   # expect 0
grep -c "services/applications-web-saas" dist/client/sitemap-0.xml     # expect >= 3
```

- [ ] **Step 6: Commit and deploy**

```bash
git add e2e/smoke.spec.ts README.md
git commit -m "Add e2e coverage for service pages and document the collection"
npx wrangler deploy
```

- [ ] **Step 7: Verify production**

```bash
for l in fr en ar; do curl -s -o /dev/null -w "$l %{http_code}\n" "https://makraz.com/$l/services/applications-web-saas"; done
curl -s https://makraz.com/en/services/e-commerce | grep -o '<title>[^<]*</title>'
```
Expected: three 200s; the EN title, not the French one.

---

## Deliberate deviations from the spec

Three, all small, recorded here so a reviewer does not treat them as mistakes:

1. **Helper signatures take a pre-filtered array, not `lang`.** The spec sketched `getService(lang, slug)`. Taking `ServiceData[]` instead keeps every function pure and unit-testable without importing `astro:content` (which Vitest cannot resolve outside an Astro build). The route filters by locale once, then calls the helpers.
2. **Pillar headings are not themselves links.** The spec said pillar headings link to pillar pages. `SectionIntro` renders its own `<h2>`, so wrapping it would mean modifying a shared component used by three other pages. Instead each pillar gets an explicit "Voir le métier en détail →" link directly beneath its description. Same destination, no shared-component change.
3. **The hub is driven by the collection rather than by its 17 hardcoded i18n keys.** The spec said "layout unchanged", and it is — visually identical rows and columns. But keeping 17 hardcoded keys alongside 17 collection entries would guarantee drift the first time a title changed. One source of truth.

## Content steps are specified by structure and angle, not final prose

Tasks 3–5 give each file's frontmatter contract, `order`, `pillar`, project mapping and a specific opening failure mode, but not the finished sentences. That is deliberate: drafting the prose *is* the work of those tasks, and Task 2 Step 7 provides a complete, copy-pasteable exemplar of the target shape and voice. Every content step is still verifiable — Task 6's integrity test enforces length floors, locale parity, no placeholders, no prices, and no French left in `en`/`ar` files.

## Notes for the implementer

- **`getStaticPaths` derives routes from content**, so a service with a missing locale simply has no page rather than a broken one. Task 6's parity test is what catches that — do not skip it.
- **Sitemap** needs no configuration; `@astrojs/sitemap` picks up new static routes automatically.
- **`imageService: 'compile'`** is already set on the Cloudflare adapter. Do not remove it — without it the case-study screenshots render as runtime `/_image?href=…` URLs that the deployed Worker does not serve.
- **The FAQ uses `<details>`**, matching the contact page. No JavaScript.
- **Writing the AR copy:** keep Arabic punctuation (`،` not `,`) and let RTL handle direction; do not manually reverse arrows or numbers.
