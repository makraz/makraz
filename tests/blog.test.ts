import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { locales } from '../src/i18n';

const DIR = new URL('../src/content/blog/', import.meta.url);
const files = readdirSync(DIR);
const slugs = [...new Set(files.map((f) => f.replace(/\.(fr|en|ar)\.md$/, '')))];

describe('blog articles', () => {
  it('exists in every locale for every article', () => {
    for (const slug of slugs) {
      for (const lang of locales) expect(files).toContain(`${slug}.${lang}.md`);
    }
  });

  it('declares the frontmatter the index and article pages read', () => {
    for (const file of files) {
      const body = readFileSync(new URL(file, DIR), 'utf8');
      const lang = file.match(/\.(fr|en|ar)\.md$/)?.[1];
      for (const field of ['title', 'description', 'slug', 'date', 'author', 'authorRole', 'category']) {
        expect(body, `${file} is missing ${field}`).toMatch(new RegExp(`^${field}:`, 'm'));
      }
      expect(body, `${file} lang mismatch`).toMatch(new RegExp(`^lang: ${lang}$`, 'm'));
      // The slug is the URL, so every locale of an article must agree on it.
      expect(body).toMatch(new RegExp(`^slug: ${file.replace(/\.(fr|en|ar)\.md$/, '')}$`, 'm'));
    }
  });

  it('writes real body copy, not just frontmatter', () => {
    for (const file of files) {
      const body = readFileSync(new URL(file, DIR), 'utf8').split('---').slice(2).join('---');
      expect(body.match(/^## /gm) ?? [], `${file} has no sections`).toHaveLength(3);
      // Characters rather than words: Arabic says the same thing in noticeably fewer words, so a
      // word threshold fair to French would flag a complete Arabic article as a stub.
      expect(body.trim().length, `${file} is thin`).toBeGreaterThan(900);
    }
  });
});
