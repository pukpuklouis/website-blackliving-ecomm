import { defineCollection, z } from 'astro:content';

const heroSlider = defineCollection({
  type: 'data',
  schema: z.object({
    slideset: z.object({
      slides: z.array(
        z.object({
          title: z.string(),
          subtitle: z.string(),
          image: z.string(),
          mobileImage: z.string().optional(),
          logo: z.string().optional(),
          buttonText: z.string(),
          buttonLink: z.string(),
          showContent: z.boolean().default(true),
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
        showContent: z.boolean().default(true),
        order: z.number(),
        subItems: z
          .array(
            z.object({
              label: z.string(),
              href: z.string(),
            })
          )
          .optional(),
      })
    ),
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

const testimonials = defineCollection({
  type: 'data',
  schema: z.object({
    testimonials: z.array(
      z.object({
        rating: z.number().min(1).max(5),
        source: z.string(),
        text: z.string(),
        image: z.string().optional(),
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
  'hero-slider': heroSlider,
  navigation,
  pages,
  storeinfo,
  features,
  testimonials,
  footer,
};
