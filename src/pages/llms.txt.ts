// /llms.txt — the site's content map for language models, per the llmstxt.org convention.
//
// Generated rather than hand-written: the service taxonomy alone is 24 slugs × 3 locales, so a
// static file in public/ would be stale the first time a service is renamed. Everything below is
// read from the same content collections the pages themselves render, which means this file cannot
// drift from the site — a service that does not exist can never appear here.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPillars, getChildren, type ServiceData } from '../lib/services';
import { locales, t, type Locale } from '../i18n';

const SITE = 'https://makraz.com';

/** Names each locale in its own language, so a model can tell the sections apart. */
const LOCALE_LABEL: Record<Locale, string> = { fr: 'Français', en: 'English', ar: 'العربية' };

/**
 * The static pages worth listing, as [path, i18n key for the description]. Deliberately not every
 * route: /mycard is a QR destination rather than readable content, and the /blog hub carries
 * noindex until its articles have had an editorial pass. Both are excluded from the sitemap for
 * the same reason, so the two files agree on what this site considers content. Individual
 * articles are listed below regardless, since those are genuine content.
 */
const PAGES: [path: string, titleKey: string, descKey: string][] = [
  ['', 'common.nav_home', 'seo.home_desc'],
  ['/services', 'common.nav_services', 'seo.services_desc'],
  ['/portfolio', 'common.nav_portfolio', 'seo.portfolio_desc'],
  ['/a-propos', 'common.nav_about', 'seo.about_desc'],
  ['/contact', 'common.nav_contact', 'seo.contact_desc'],
  ['/mentions-legales', 'legal.lg_title', 'seo.legal_desc'],
];

/** Case-study pages, keyed by the portfolio slug that has its own page. */
const CASE_SLUGS = ['farblieferant', 'phpmorocco', 'aya'] as const;

/**
 * One markdown link line. Newlines inside a description would break the list, and llms.txt is
 * parsed line-wise, so descriptions are flattened to a single line.
 */
const link = (name: string, url: string, desc?: string, indent = '') =>
  `${indent}- [${name}](${url})${desc ? `: ${desc.replace(/\s+/g, ' ').trim()}` : ''}`;

export const GET: APIRoute = async () => {
  const allServices = await getCollection('services');
  const allBlog = await getCollection('blog');
  const allCases = await getCollection('caseStudies');

  const out: string[] = [
    '# MAKRAZ',
    '',
    `> ${t('fr', 'seo.home_desc')}`,
    '',
    'Studio de développement et de design basé à Marrakech, Maroc.',
    'Le site est publié en trois langues — français (par défaut), anglais et arabe — sous /fr, /en et /ar.',
    'Les chemins d\'URL sont identiques dans les trois langues ; seul le préfixe de langue change.',
    `Sitemap : ${SITE}/sitemap-index.xml`,
  ];

  for (const lang of locales) {
    const base = `${SITE}/${lang}`;
    const services = allServices
      .filter((e) => e.data.lang === lang)
      .map((e) => e.data as ServiceData);

    out.push('', `## ${LOCALE_LABEL[lang]} — Pages (${lang.toUpperCase()})`, '');
    for (const [path, titleKey, descKey] of PAGES) {
      out.push(link(t(lang, titleKey), `${base}${path}`, t(lang, descKey)));
    }

    // Pillars carry their leaves indented beneath them, so the taxonomy's shape survives the
    // flattening into a list — a model can see that "Sites internet" sits under "Développement".
    out.push('', `## ${LOCALE_LABEL[lang]} — Services (${lang.toUpperCase()})`, '');
    for (const pillar of getPillars(services)) {
      out.push(link(pillar.title, `${base}/services/${pillar.slug}`, pillar.lead));
      for (const leaf of getChildren(services, pillar.slug)) {
        out.push(link(leaf.title, `${base}/services/${leaf.slug}`, leaf.lead, '  '));
      }
    }

    out.push('', `## ${LOCALE_LABEL[lang]} — ${t(lang, 'common.nav_portfolio')} (${lang.toUpperCase()})`, '');
    for (const slug of CASE_SLUGS) {
      // startsWith(slug), not `${slug}.` — the glob loader slugifies "aya.fr.md" to the id
      // "aya-fr", so a dot never survives. Same lookup the portfolio pages use.
      const entry = allCases.find((e) => e.data.lang === lang && e.id.startsWith(slug));
      if (entry) out.push(link(entry.data.project, `${base}/portfolio/${slug}`, entry.data.kicker));
    }

    const posts = allBlog
      .filter((e) => e.data.lang === lang)
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
    if (posts.length) {
      out.push('', `## ${LOCALE_LABEL[lang]} — ${t(lang, 'common.nav_blog')} (${lang.toUpperCase()})`, '');
      for (const post of posts) {
        out.push(link(post.data.title, `${base}/blog/${post.data.slug}`, post.data.description));
      }
    }
  }

  out.push('');

  return new Response(out.join('\n'), {
    headers: {
      // text/plain so it renders in a browser rather than downloading; charset is not optional
      // here, since the Arabic section is unreadable if a client guesses latin-1.
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
