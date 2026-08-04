import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { locales, t } from '../src/i18n';

const DIR = new URL('../src/content/case-studies/', import.meta.url);
const read = (file: string) => readFileSync(new URL(file, DIR), 'utf8');

// Every case study follows the same shape, so assert across the set rather than one of them.
const STUDIES = [
  { slug: 'farblieferant', keyspace: 'case_farblieferant' },
  { slug: 'phpmorocco', keyspace: 'case_phpmorocco' },
  { slug: 'aya', keyspace: 'case_aya' },
];

describe('case study content', () => {
  it('has one markdown file per locale for each case study', () => {
    const files = readdirSync(DIR);
    for (const { slug } of STUDIES) {
      for (const lang of locales) expect(files, `${slug}.${lang}.md`).toContain(`${slug}.${lang}.md`);
    }
  });

  it('declares the matching lang and project in every front matter', () => {
    for (const { slug } of STUDIES) {
      for (const lang of locales) {
        const body = read(`${slug}.${lang}.md`);
        expect(body, `${slug}.${lang}`).toMatch(new RegExp(`^lang: ${lang}$`, 'm'));
        expect(body, `${slug}.${lang}`).toMatch(/^project: .+$/m);
        expect(body, `${slug}.${lang}`).toMatch(/^kicker: .+$/m);
      }
    }
  });

  it('gives each case study three body sections in every locale', () => {
    for (const { slug } of STUDIES) {
      for (const lang of locales) {
        const headings = read(`${slug}.${lang}.md`).match(/^## .+$/gm) ?? [];
        expect(headings, `${slug}.${lang}`).toHaveLength(3);
      }
    }
  });
});

describe('case study i18n', () => {
  const KEYS = ['back', 'sub', 'm_client', 'm_sector', 'm_sector_v', 'm_services', 'm_services_v', 'm_link', 'cta_title', 'cta_btn'];

  it('defines every page key for both case studies in all locales', () => {
    for (const { keyspace } of STUDIES) {
      for (const lang of locales) {
        for (const key of KEYS) expect(t(lang, `${keyspace}.${key}`), `${lang}/${keyspace}.${key}`).toBeTruthy();
        expect(t(lang, `seo.${keyspace}_title`)).toBeTruthy();
        expect(t(lang, `seo.${keyspace}_desc`)).toBeTruthy();
      }
    }
  });

  it('points the back link with the reading direction', () => {
    for (const { keyspace } of STUDIES) {
      // LTR reads back as leftwards, RTL as rightwards. A mismatch here shipped once already.
      expect(t('fr', `${keyspace}.back`)).toContain('←');
      expect(t('en', `${keyspace}.back`)).toContain('←');
      expect(t('ar', `${keyspace}.back`)).toContain('→');
    }
  });
});
