// @ts-check
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const LOCALES = ['fr', 'en', 'ar'];

/**
 * What a page is actually made of: its template/markdown, plus the slice of the locale JSON that
 * holds its copy. The JSON is shared by every page, so it is queried per key namespace rather than
 * whole-file — otherwise one translation edit marks every URL as changed on the same timestamp,
 * which is no more informative than stamping them all with the build time.
 * @param {string} url
 * @returns {{ files: string[], keyspace?: { file: string, prefix: string } }}
 */
function sourcesFor(url) {
  const path = new URL(url).pathname.replace(/\/$/, '');
  const match = path.match(new RegExp(`^/(${LOCALES.join('|')})(/.*)?$`));
  if (!match) return { files: [] };
  const [, lang, rest = ''] = match;
  const slug = rest.split('/')[2];
  const files = [];
  /** @type {string | undefined} */
  let prefix;

  if (rest === '') { files.push('src/pages/[lang]/index.astro'); prefix = 'home.'; }
  else if (/^\/blog\/[^/]+$/.test(rest)) files.push(`src/content/blog/${slug}.${lang}.md`, 'src/pages/[lang]/blog/[slug].astro');
  else if (/^\/portfolio\/[^/]+$/.test(rest)) {
    files.push(`src/pages/[lang]/portfolio/${slug}.astro`, `src/content/case-studies/${slug}.${lang}.md`);
    prefix = `case_${slug}.`;
  }
  // Service pages are one dynamic route over a content collection, so the page's own source is the
  // markdown file, not a per-slug .astro. Without this branch they shipped with no lastmod at all.
  else if (/^\/services\/[^/]+$/.test(rest)) {
    files.push(`src/content/services/${slug}.${lang}.md`, 'src/pages/[lang]/services/[slug].astro');
  } else {
    files.push(`src/pages/[lang]${rest}.astro`);
    prefix = { '/services': 'services.', '/portfolio': 'portfolio.', '/a-propos': 'about.', '/contact': 'contact.', '/blog': 'blog.', '/mentions-legales': 'legal.' }[rest];
  }

  return {
    files: files.filter((f) => existsSync(f)),
    keyspace: prefix ? { file: `src/i18n/${lang}.json`, prefix } : undefined,
  };
}

/** @type {Map<string, string | undefined>} */
const lastmodCache = new Map();

/**
 * Newest commit date across a page's sources, as the sitemap `lastmod`. Deliberately git-derived
 * rather than build time: stamping every page with "now" on each deploy tells crawlers everything
 * changed every time, which is both false and a reason for them to stop trusting the signal.
 * Returns undefined outside a git checkout so the field is simply omitted.
 * @param {string} url
 */
function lastmodFor(url) {
  if (lastmodCache.has(url)) return lastmodCache.get(url);
  const { files, keyspace } = sourcesFor(url);
  /** @type {string | undefined} */
  let newest;
  /** @param {string[]} args */
  const commitDate = (args) => {
    try {
      return execFileSync('git', ['log', '-1', '--format=%cI', ...args], { encoding: 'utf8' }).trim();
    } catch {
      return ''; // No git history (shallow clone, exported tarball) — lastmod is simply omitted.
    }
  };

  for (const file of files) {
    const out = commitDate(['--', file]);
    if (out && (!newest || out > newest)) newest = out;
  }
  if (keyspace) {
    // -G matches commits whose diff touched a line containing this key prefix, so a page's date
    // moves when its own copy changed, not when any copy anywhere changed.
    const out = commitDate([`-G"${keyspace.prefix.replace('.', '\\.')}`, '--', keyspace.file]);
    if (out && (!newest || out > newest)) newest = out;
  }

  lastmodCache.set(url, newest);
  return newest;
}

export default defineConfig({
  site: 'https://makraz.com',
  output: 'static',
  // imageService: 'compile' optimizes images with sharp at build time. Without it the adapter
  // emits runtime /_image?… URLs, which the deployed Worker does not serve for a static build.
  adapter: cloudflare({ imageService: 'compile' }),
  trailingSlash: 'never',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr', en: 'en', ar: 'ar' } },
      // Pages that carry noindex are kept out of the sitemap too, so the two signals agree:
      // /mycard is a QR destination rather than search content, and the /blog hub stays out until
      // its articles have had an editorial pass. Individual articles stay listed.
      filter: (page) => !/\/mycard\/?$/.test(page) && !/\/blog\/?$/.test(page),
      serialize(item) {
        const lastmod = lastmodFor(item.url);
        if (lastmod) item.lastmod = lastmod;
        // The i18n option emits fr/en/ar alternates but no x-default, while every page's <head>
        // declares one. Point it at French, matching both the head tag and `defaultLocale`.
        if (item.links?.length) {
          const fallback = item.url.replace(new RegExp(`/(${LOCALES.join('|')})(/|$)`), '/fr$2');
          item.links = [...item.links, { lang: 'x-default', url: fallback }];
        }
        // changefreq and priority are deliberately omitted: Google ignores both, and inventing
        // values for them is noise that has to be maintained.
        return item;
      },
    }),
  ],
  redirects: { '/': '/fr' },
  vite: {
    plugins: [tailwindcss()],
    define: {
      'process.env.ALLOW_MISSING_TURNSTILE': JSON.stringify(process.env.ALLOW_MISSING_TURNSTILE ?? ''),
    },
  },
});
