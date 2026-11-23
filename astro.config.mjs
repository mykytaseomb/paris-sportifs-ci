import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Carte chemin -> date « updated » des pages MDX, pour <lastmod> du sitemap
const lastmod = {};
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) return walk(p);
  if (!p.endsWith('.mdx')) return;
  const src = readFileSync(p, 'utf8');
  const path = src.match(/^path:\s*"([^"]+)"/m)?.[1];
  const upd = src.match(/^updated:\s*"([^"]+)"/m)?.[1];
  if (path && upd) lastmod[path] = upd;
});
walk('./src/content/pages');

export default defineConfig({
  site: 'https://paris-sportifs.com.ci',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/go/'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        if (lastmod[path]) item.lastmod = new Date(lastmod[path]).toISOString();
        return item;
      },
    }),
  ],
});
