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
