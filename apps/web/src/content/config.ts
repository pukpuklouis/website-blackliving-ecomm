import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    author: z.string().default('Black Living 專業團隊'),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const products = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    category: z.enum(['simmons-black', 'accessories', 'us-imports']),
    images: z.array(z.string()),
    variants: z.array(z.object({
      size: z.string(),
      firmness: z.string().optional(),
      price: z.number(),
      originalPrice: z.number().optional(),
    })),
    features: z.array(z.string()),
    specifications: z.record(z.string()),
    inStock: z.boolean().default(true),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  posts,
  products,
};