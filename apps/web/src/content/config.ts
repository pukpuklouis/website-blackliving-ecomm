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
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const products = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    category: z.enum(['simmons-black', 'accessories', 'us-imports']),
    images: z.array(z.string()),
    variants: z.array(
      z.object({
        size: z.string(),
        firmness: z.string().optional(),
        price: z.number(),
        originalPrice: z.number().optional(),
      })
    ),
    features: z.array(z.string()),
    specifications: z.record(z.string()),
    inStock: z.boolean().default(true),
    featured: z.boolean().default(false),
  }),
});

const heroSlider = defineCollection({
  type: 'data',
  schema: z.object({
    slideset: z.object({
      slides: z.array(
        z.object({
          title: z.string(),
          subtitle: z.string(),
          image: z.string(),
          logo: z.string().optional(),
          buttonText: z.string(),
          buttonLink: z.string(),
          order: z.number(),
        })
      ),
    }),
  }),
});

const navigation = defineCollection({
  type: 'data',
  schema: z.object({
    items: z.array(
      z.object({
        label: z.string(),
        href: z.string(),
        order: z.number(),
      })
    ),
  }),
});

const categories = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    series: z.string(),
    brand: z.string(),
    features: z.array(z.string()),
    seoKeywords: z.string(),
    category: z.string(),
    urlPath: z.string(),
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    lastUpdated: z.date().optional(),
  }),
});

const storeinfo = defineCollection({
  type: 'data',
  schema: z.object({
    stores: z.array(
      z.object({
        name: z.string(),
        address: z.string(),
        phone: z.string(),
        opening: z.string(),
        embedUrl: z.string(),
        infoBoxPosition: z.enum([
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
          'center-left',
          'center-right',
        ]),
        mapHeight: z.string(),
        responsivePosition: z.enum(['top', 'bottom']),
        bgColor: z.string(),
        textColor: z.string(),
        borderColor: z.string(),
        textAlign: z.enum(['left', 'center', 'right']),
      })
    ),
  }),
});

const features = defineCollection({
  type: 'data',
  schema: z.object({
    defaultFeatures: z.array(
      z.object({
        icon: z.string(),
        title: z.string(),
        description: z.string(),
      })
    ),
  }),
});

const footer = defineCollection({
  type: 'data',
  schema: z.object({
    sections: z.array(
      z.object({
        title: z.string(),
        links: z.array(
          z.object({
            text: z.string(),
            url: z.string(),
          })
        ),
      })
    ),
  }),
});

export const collections = {
  posts,
  products,
  'hero-slider': heroSlider,
  navigation,
  categories,
  pages,
  storeinfo,
  features,
  footer,
};
