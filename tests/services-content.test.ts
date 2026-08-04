import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { locales } from '../src/i18n';
import { getChildren, getPillars, type ServiceData } from '../src/lib/services';

const DIR = new URL('../src/content/services/', import.meta.url);
const files = readdirSync(DIR);

// Frontmatter is read with a deliberately dumb parser: the point is to catch a file that the real
// loader would silently skip, so this must not depend on the loader working.
function frontmatter(file: string): Record<string, string> {
  const body = readFileSync(new URL(file, DIR), 'utf8');
  const block = body.split('---')[1] ?? '';
  const out: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  return out;
}

describe('service content files', () => {
  it('exists in all three locales for every service', () => {
    const slugs = [...new Set(files.map((f) => f.replace(/\.(fr|en|ar)\.md$/, '')))];
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      for (const lang of locales) expect(files, `${slug}.${lang}.md`).toContain(`${slug}.${lang}.md`);
    }
  });

  it('agrees with its filename on slug and lang', () => {
    for (const file of files) {
      const fm = frontmatter(file);
      const [, slug, lang] = file.match(/^(.+)\.(fr|en|ar)\.md$/) ?? [];
      // A mismatch here is what silently produced one page per slug instead of one per locale.
      expect(fm.slug, `${file} slug`).toBe(slug);
      expect(fm.lang, `${file} lang`).toBe(lang);
    }
  });

  it('holds no placeholder markers', () => {
    for (const file of files) {
      const body = readFileSync(new URL(file, DIR), 'utf8');
      expect(body, `${file}`).not.toMatch(/\[(à valider|to confirm|à compléter|TBD)/i);
    }
  });

  it('quotes any value containing a colon so the YAML still parses', () => {
    for (const file of files) {
      const block = readFileSync(new URL(file, DIR), 'utf8').split('---')[1] ?? '';
      for (const line of block.split('\n')) {
        const m = line.match(/^\s*(?:- )?[a-z_]+:\s+(.+)$/);
        if (!m) continue;
        const value = m[1];
        if (value.startsWith('"') || value.startsWith("'")) continue;
        expect(value, `${file}: unquoted value containing ": " breaks the build`).not.toMatch(/: /);
      }
    }
  });

  it('gives every pillar a number and no leaf-only fields', () => {
    for (const file of files) {
      const fm = frontmatter(file);
      if (fm.kind !== 'pillar') continue;
      expect(fm.number, `${file} needs a number`).toBeTruthy();
      const body = readFileSync(new URL(file, DIR), 'utf8').split('---')[1];
      expect(body, `${file} is a pillar and must not define included/steps`).not.toMatch(/^(included|steps):/m);
    }
  });
});

describe('taxonomy over the real files', () => {
  const dataFor = (lang: string): ServiceData[] =>
    files.filter((f) => f.endsWith(`.${lang}.md`)).map((f) => {
      const fm = frontmatter(f);
      return { ...fm, order: Number(fm.order) } as unknown as ServiceData;
    });

  it('orders pillars identically in every locale', () => {
    const reference = getPillars(dataFor('fr')).map((s) => s.slug);
    expect(reference.length).toBeGreaterThan(0);
    for (const lang of locales) expect(getPillars(dataFor(lang)).map((s) => s.slug)).toEqual(reference);
  });

  it('never leaves a leaf pointing at a pillar that does not exist', () => {
    for (const lang of locales) {
      const all = dataFor(lang);
      const pillars = new Set(getPillars(all).map((s) => s.slug));
      for (const leaf of all.filter((s) => s.kind === 'leaf')) {
        expect(pillars, `${leaf.slug}.${lang} points at "${leaf.pillar}"`).toContain(leaf.pillar);
      }
    }
  });

  it('resolves children consistently across locales', () => {
    for (const pillar of getPillars(dataFor('fr'))) {
      const counts = locales.map((lang) => getChildren(dataFor(lang), pillar.slug).length);
      expect(new Set(counts).size, `${pillar.slug} has different child counts per locale: ${counts}`).toBe(1);
    }
  });
});
