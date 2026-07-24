import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: z.object({
    project: z.string(),
    lang: z.enum(['fr', 'en', 'ar']),
    kicker: z.string(),
    stack: z.array(z.string()),
    results: z.array(z.object({ value: z.string(), label: z.string() })),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(['fr', 'en', 'ar']),
    slug: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    authorRole: z.string(),
  }),
});

export const collections = { caseStudies, blog };
