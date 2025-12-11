import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array;
  const lowercaseItems = array.map((str) => str.toLowerCase());
  const distinctItems = new Set(lowercaseItems);
  return Array.from(distinctItems);
}

const postSchema = z.object({
  title: z.string(),
  description: z.string().min(10).max(160),
  publishDate: z.string().or(z.date()).transform((val) => {
    if (val instanceof Date) return val;
    // For date-only strings (YYYY-MM-DD), treat as local date not UTC
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [year, month, day] = val.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(val);
  }),
  updatedDate: z.string().or(z.date()).transform((val) => {
    if (val instanceof Date) return val;
    // For date-only strings (YYYY-MM-DD), treat as local date not UTC
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [year, month, day] = val.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(val);
  }).optional(),
  coverImage: z.object({
    src: z.string().optional(),
    alt: z.string().default(""),
  }).optional(),
  overlayImage: z.string().optional(),
  overlayImageAlt: z.string().optional(),
  overlaySvg: z.string().optional(),
  overlaySvgAlt: z.string().optional(),
  tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
  draft: z.boolean().default(false),
  sticky: z.boolean().default(false),
  externalUrl: z.string().optional(),
  youtube: z.object({
    discriminant: z.boolean(),
    value: z.object({
      url: z.string().optional(),
      title: z.string().optional(),
      controls: z.boolean().optional(),
      useCustomPlayer: z.boolean().optional(),
      mute: z.boolean().optional(),
      loop: z.boolean().optional(),
      start: z.preprocess(
        (val) => {
          if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) return undefined;
          return typeof val === 'string' ? parseFloat(val) : val;
        },
        z.number().optional()
      ),
      end: z.preprocess(
        (val) => {
          if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) return undefined;
          return typeof val === 'string' ? parseFloat(val) : val;
        },
        z.number().optional()
      ),
      clickToLoad: z.boolean().optional(),
      showMuteButton: z.boolean().optional(),
      videoOnly: z.boolean().optional(),
      svgatorSync: z.boolean().optional(),
      svgatorId: z.string().optional(),
      interactiveMode: z.enum(['sync', 'independent', 'controller']).optional(),
    }).optional()
  }).optional(),
  secondaryVideo: z.object({
    discriminant: z.boolean(),
    value: z.object({
      url: z.string().optional(),
      title: z.string().optional(),
      controls: z.boolean().optional(),
      useCustomPlayer: z.boolean().optional(),
      mute: z.boolean().optional(),
      loop: z.boolean().optional(),
      start: z.preprocess(
        (val) => {
          if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) return undefined;
          return typeof val === 'string' ? parseFloat(val) : val;
        },
        z.number().optional()
      ),
      end: z.preprocess(
        (val) => {
          if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) return undefined;
          return typeof val === 'string' ? parseFloat(val) : val;
        },
        z.number().optional()
      ),
      clickToLoad: z.boolean().optional(),
      showMuteButton: z.boolean().optional(),
      videoOnly: z.boolean().optional(),
      svgatorSync: z.boolean().optional(),
      svgatorId: z.string().optional(),
      interactiveMode: z.enum(['sync', 'independent', 'controller']).optional(),
    }).optional()
  }).optional(),
});

const pagesSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  useTemplateSystem: z.boolean().optional().default(false),
  sections: z.array(z.any()).optional().default([]),
}).passthrough(); // Allow additional fields

const siteSettingsSchema = z.any();
const formSettingsSchema = z.any();
const bioSchema = z.any();
const socialLinksSchema = z.any();
const resumeSchema = z.any();
const testimonialsSchema = z.any();
const faqsSchema = z.any();
const contentBlocksSchema = z.any();
const ctasSchema = z.any();
const menuItemsSchema = z.any();

export const collections = {
  // Posts - loaded from content/post/
  post: defineCollection({
    loader: glob({ pattern: '**/[^_]*.mdoc', base: './content/post' }),
    schema: postSchema,
  }),

  // Pages - loaded from content/pages/
  pages: defineCollection({
    loader: glob({ pattern: '**/*.mdoc', base: './content/pages' }),
    schema: pagesSchema,
  }),

  // Site Settings singleton - loaded from content/siteSettings/
  siteSettings: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/siteSettings' }),
    schema: siteSettingsSchema,
  }),

  // Form Settings singleton - loaded from content/formSettings/
  formSettings: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/formSettings' }),
    schema: formSettingsSchema,
  }),

  // Bio collection - loaded from content/bio/
  bio: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/bio' }),
    schema: bioSchema,
  }),

  // Social Links - loaded from content/socialLinks/
  socialLinks: defineCollection({
    loader: glob({ pattern: '**/*.{json,yaml}', base: './content/socialLinks' }),
    schema: socialLinksSchema,
  }),

  // Resume - loaded from content/resume/
  resume: defineCollection({
    loader: glob({ pattern: '**/*.mdoc', base: './content/resume' }),
    schema: resumeSchema,
  }),

  // Testimonials - loaded from content/testimonials/
  testimonials: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/testimonials' }),
    schema: testimonialsSchema,
  }),

  // FAQs - loaded from content/faqs/
  faqs: defineCollection({
    loader: glob({ pattern: '**/*.mdoc', base: './content/faqs' }),
    schema: faqsSchema,
  }),

  // Content Blocks - loaded from content/contentBlocks/
  // Uses Keystatic format with markdoc content in separate files
  contentBlocks: defineCollection({
    loader: glob({ pattern: '**/*.{yaml,mdoc}', base: './content/contentBlocks' }),
    schema: contentBlocksSchema,
  }),

  // CTAs - loaded from content/CTAs/
  CTAs: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/CTAs' }),
    schema: ctasSchema,
  }),

  // Menu Items - loaded from content/menuItems/
  menuItems: defineCollection({
    loader: glob({ pattern: '**/*.{json,yaml}', base: './content/menuItems' }),
    schema: menuItemsSchema,
  }),

  // Footer Menu Items - loaded from content/footerMenuItems/
  footerMenuItems: defineCollection({
    loader: glob({ pattern: '**/*.{json,yaml}', base: './content/footerMenuItems' }),
    schema: menuItemsSchema,
  }),

  // Home page settings - loaded from content/home/
  home: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/home' }),
    schema: z.any(),
  }),

  // Contact page settings - loaded from content/contactPage/
  contactPage: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/contactPage' }),
    schema: z.any(),
  }),

  // Photo settings - loaded from content/photoSettings/
  photoSettings: defineCollection({
    loader: glob({ pattern: '**/*.{json,yaml}', base: './content/photoSettings' }),
    schema: z.any(),
  }),

  // PWA settings - loaded from content/pwaSettings/
  pwaSettings: defineCollection({
    loader: glob({ pattern: '**/*.{json,yaml}', base: './content/pwaSettings' }),
    schema: z.any(),
  }),

  // Resume settings - loaded from content/resumeSettings/
  resumeSettings: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/resumeSettings' }),
    schema: z.any(),
  }),

  // Language settings - loaded from content/language/
  language: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/language' }),
    schema: z.any(),
  }),

  // Style apps - loaded from content/styleapps/
  styleapps: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/styleapps' }),
    schema: z.any(),
  }),

  // YouTube Feeds - loaded from content/youtubeFeeds/
  youtubeFeeds: defineCollection({
    loader: glob({ pattern: '**/*.yaml', base: './content/youtubeFeeds' }),
    schema: z.any(),
  }),
};
