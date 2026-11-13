import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({
    path: z.string(),                       // URL finale, ex. « /1xbet-apk/ »
    title: z.string(),                      // H1
    seo_title: z.string(),
    seo_desc: z.string(),
    focus: z.string().optional(),           // mot-clé principal
    brand: z.string().optional(),           // opérateur de la page (barre fixe mobile, fil d'Ariane)
    type: z.string().optional(),            // '' | apk | code-promo | inscription | ranking | info
    breadcrumb: z.string().optional(),
    filter: z.any().optional(),             // filtre de classement (pages de type ranking)
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    shots: z.array(z.string()).optional(),  // captures à ajouter (liste pour l'équipe)
    updated: z.string().default('2026-11-09'),
  }),
});

export const collections = { pages };
