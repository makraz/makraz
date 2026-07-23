// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://makraz.com',
  output: 'static',
  adapter: cloudflare(),
  trailingSlash: 'never',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr', en: 'en', ar: 'ar' } },
    }),
  ],
  redirects: { '/': '/fr' },
  vite: { plugins: [tailwindcss()] },
});
