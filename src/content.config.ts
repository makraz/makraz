import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: z.object({
    project: z.string(),
    lang: z.enum(['fr', 'en', 'ar']),
    kicker: z.string(),
  }),
});

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(['fr', 'en', 'ar']),
    slug: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    authorRole: z.string(),
    // Shown in the card's meta line. Localized per file rather than looked up, since the set of
    // categories is editorial and each translation names it in its own words.
    category: z.string(),
  }),
});

const serviceItem = z.object({ title: z.string(), description: z.string() });

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z
    .object({
      slug: z.string(),
      lang: z.enum(['fr', 'en', 'ar']),
      kind: z.enum(['pillar', 'leaf']),
      pillar: z.string(),
      order: z.number(),
      number: z.string().optional(),
      title: z.string(),
      lead: z.string(),
      included: z.array(serviceItem).optional(),
      steps: z.array(serviceItem).optional(),
      engagement: z.object({ model: z.string(), drivers: z.string() }),
      faq: z.array(z.object({ q: z.string(), a: z.string() })).min(2),
      project: z.enum(['farblieferant', 'phpmorocco', 'marrakechphp']).optional(),
    })
    .superRefine((d, ctx) => {
      if (d.kind === 'leaf') {
        if (!d.included?.length) ctx.addIssue({ code: 'custom', message: `${d.slug}.${d.lang}: leaf requires a non-empty included[]` });
        if (!d.steps?.length) ctx.addIssue({ code: 'custom', message: `${d.slug}.${d.lang}: leaf requires a non-empty steps[]` });
      } else {
        if (d.included || d.steps) ctx.addIssue({ code: 'custom', message: `${d.slug}.${d.lang}: pillar must not define included/steps` });
        if (!d.number) ctx.addIssue({ code: 'custom', message: `${d.slug}.${d.lang}: pillar requires number` });
      }
    }),
});

export const collections = { caseStudies, blog, services };
