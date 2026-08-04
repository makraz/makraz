import { describe, expect, it } from 'vitest';
import { locales, t } from '../src/i18n';
import fr from '../src/i18n/fr.json';

// Every page's <title>/<meta description> comes from a seo.*_title / seo.*_desc pair, so the whole
// site's metadata can be checked here without rendering anything.
const SEO_KEYS = Object.keys(fr as Record<string, string>).filter((k) => k.startsWith('seo.'));
const TITLES = SEO_KEYS.filter((k) => k.endsWith('_title'));
const DESCS = SEO_KEYS.filter((k) => k.endsWith('_desc'));

describe('page titles', () => {
  it('are unique across every page and locale', () => {
    // FR and EN once collided on Contact/Portfolio/Services, because those words are spelled the
    // same in both languages. Duplicate titles make pages compete with each other.
    const seen = new Map<string, string>();
    for (const lang of locales) {
      for (const key of TITLES) {
        const title = t(lang, key);
        const where = `${lang}/${key}`;
        expect(seen.has(title), `duplicate title ${JSON.stringify(title)}: ${seen.get(title)} and ${where}`).toBe(false);
        seen.set(title, where);
      }
    }
  });

  it('stay within the length search engines display', () => {
    for (const lang of locales) {
      for (const key of TITLES) {
        const title = t(lang, key);
        expect(title.length, `${lang}/${key} too short`).toBeGreaterThanOrEqual(15);
        expect(title.length, `${lang}/${key} is ${title.length} chars`).toBeLessThanOrEqual(65);
      }
    }
  });
});

describe('meta descriptions', () => {
  it('use the snippet space search results give them', () => {
    for (const lang of locales) {
      for (const key of DESCS) {
        const desc = t(lang, key);
        // Under ~70 chars wastes the snippet and invites Google to write its own; over ~160 truncates.
        expect(desc.length, `${lang}/${key} is only ${desc.length} chars`).toBeGreaterThanOrEqual(70);
        expect(desc.length, `${lang}/${key} is ${desc.length} chars`).toBeLessThanOrEqual(160);
      }
    }
  });

  it('differ from the page title', () => {
    for (const lang of locales) {
      for (const key of DESCS) {
        const titleKey = key.replace(/_desc$/, '_title');
        if (!TITLES.includes(titleKey)) continue;
        expect(t(lang, key)).not.toBe(t(lang, titleKey));
      }
    }
  });
});
