import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import fs from "fs";
import rehypeExternalLinks from "rehype-external-links";
import remarkUnwrapImages from "remark-unwrap-images";
import { remarkReadingTime } from "./src/utils/remark-reading-time";
import AstroPWA from '@vite-pwa/astro';
import markdoc from "@astrojs/markdoc";
import keystatic from '@keystatic/astro';
import netlify from "@astrojs/netlify";
import vercel from '@astrojs/vercel/serverless';
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from './keystatic.config';

export const reader = createReader(process.cwd(), keystaticConfig);

const isVercel = !!process.env.VERCEL;
const adapter = isVercel ? vercel() : netlify();
const output = isVercel ? 'server' : 'hybrid';

const pwaSettings = await reader.singletons.pwaSettings.read();


const pwaConfig = pwaSettings || {
  startUrl: '/',
  name: 'PIRATE',
  shortName: 'PIRATE',
  description: 'Your app description here',
  themeColor: '#ffffff',
  backgroundColor: '#ffffff',
  display: 'standalone',
  icon192: '/icon-192x192.png',
  icon512: '/icon-512x512.png',
  siteUrl: 'https://example.com',
  screenshot: '/socialCard.webp', 
};

export default defineConfig({

  integrations: [mdx(), react(), icon(), tailwind({
    applyBaseStyles: false
  }), sitemap(), keystatic(),
  AstroPWA({
    registerType: 'autoUpdate',
    includeAssets: ['robots.txt', 'manifest.webmanifest'],
    manifest: {
      id: pwaConfig.startUrl || '/',
      name: pwaConfig.name || 'PIRATE',
      short_name: pwaConfig.shortName || 'PIRATE',
      description: pwaConfig.description || '',
      theme_color: pwaConfig.themeColor || '#ffffff',
      start_url: pwaConfig.startUrl || '/',
      background_color: pwaConfig.backgroundColor || '#ffffff',
      display: (pwaConfig.display as 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser') || 'standalone',
      icons: [
        {
          src: pwaConfig.icon192 ?? '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: pwaConfig.icon512 ?? '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      screenshots: pwaConfig.screenshot ? [
        {
          src: pwaConfig.screenshot,
          sizes: '320x640',
          type: 'image/png'
        }
      ] : [],
    },
    workbox: {
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    }
  }),  
  markdoc()],  markdown: {
    rehypePlugins: [[rehypeExternalLinks, {
      rel: ["nofollow", "noopener", "noreferrer"],
      target: "_blank"
    }]],
    remarkPlugins: [remarkUnwrapImages, remarkReadingTime],
    remarkRehype: {
      footnoteLabelProperties: {
        className: [""]
      }
    },
    shikiConfig: {
      theme: 'dracula',
    },
  },
  output: output,
  prefetch: true,
  image: {
		domains: ["webmention.io"],
	},
  site: pwaConfig.siteUrl ?? 'https://example.com',  redirects: {
    '/admin': '/keystatic'
  },
  vite: {
    server: {
      fs: {
        strict: false,
      },
    },
    build: {
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 50000,
    },
    plugins: [rawFonts([".ttf", ".woff"])],
  },
  adapter: adapter
});

function rawFonts(ext: string[]) {
  return {
    name: "vite-plugin-raw-fonts",
    transform(code: string, id: string) {
      if (ext.some((e) => id.endsWith(e))) {
        const buffer = fs.readFileSync(id);
        return {
          code: `export default ${JSON.stringify(buffer)}`,
          map: null,
        };
      }
    },
  };
}


