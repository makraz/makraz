export type ServiceKind = 'pillar' | 'leaf';
export type ServiceProject = 'farblieferant' | 'phpmorocco' | 'marrakechphp' | 'aya';
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
