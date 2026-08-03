// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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
      // The business-card pages are a QR destination, not search-engine content, and they carry
      // noindex — keep them out of the sitemap so the two signals agree.
      filter: (page) => !/\/mycard\/?$/.test(page),
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
