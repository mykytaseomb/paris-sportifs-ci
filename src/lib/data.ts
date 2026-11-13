import operatorsRaw from '../data/operators.json';
import meta from '../data/meta.json';
import { getCollection } from 'astro:content';

export type Operator = (typeof operatorsRaw)[number] & {
  icon?: string;
  bonus_no_deposit?: boolean;
  review_pros?: string[];
  review_cons?: string[];
  sports?: string[];
};

/** Filtre d'une page de classement (déclaré dans le frontmatter des pages). */
export interface RankFilter {
  payments?: string[];        // l'opérateur doit accepter au moins un de ces moyens
  devices?: string[];         // ... au moins un de ces supports
  products?: string[];        // ... au moins un de ces produits
  sports?: string[];          // ... tous ces sports/jeux vérifiés dans la ligne de paris
  lonaci?: string[];          // statuts acceptés : agree | officiel | declare | absent
  has_bonus?: boolean;        // offre de bienvenue chiffrée
  min_rating?: number;
  sort?: 'rating' | 'bonus' | 'min_dep';
  limit?: number;
}

export const operators = operatorsRaw as Operator[];
export const site = meta.site;
export const payments = meta.payments as Record<string, { name: string; icon: string }>;
export const devices = meta.devices as Record<string, { name: string; icon: string }>;
export const nav = meta.nav;
export const tags = meta.tags;
export const sports = (meta as any).sports as { key: string; label: string; href: string }[];

export function getOperator(slug: string): Operator {
  const o = operators.find((x) => x.slug === slug);
  if (!o) throw new Error(`Opérateur inconnu : ${slug}`);
  return o;
}

export function rankOperators(filter: RankFilter = {}): Operator[] {
  const anyOf = (list: string[] | undefined, wanted?: string[]) =>
    !wanted || wanted.length === 0 || (list ?? []).some((v) => wanted.includes(v));
  let list = operators.filter(
    (o) =>
      anyOf(o.payments, filter.payments) &&
      anyOf(o.devices, filter.devices) &&
      anyOf(o.products, filter.products) &&
      (!filter.sports || filter.sports.every((v) => (o.sports ?? []).includes(v))) &&
      (!filter.lonaci || filter.lonaci.includes(o.lonaci_status)) &&
      (!filter.has_bonus || o.bonus_max_fcfa > 0 || o.bonus_no_deposit) &&
      (filter.min_rating === undefined || o.rating >= filter.min_rating),
  );
  const byRating = (a: Operator, b: Operator) => b.rating - a.rating;
  if (filter.sort === 'bonus') list.sort((a, b) => b.bonus_max_fcfa - a.bonus_max_fcfa || byRating(a, b));
  else if (filter.sort === 'min_dep')
    list.sort((a, b) => (a.min_dep_fcfa ?? 1e9) - (b.min_dep_fcfa ?? 1e9) || byRating(a, b));
  else list.sort(byRating);
  return filter.limit ? list.slice(0, filter.limit) : list;
}

let pathsCache: Set<string> | null = null;
/** Chemins des pages existantes (ex. « /1xbet-apk/ »). */
export async function existingPaths(): Promise<Set<string>> {
  if (!pathsCache) {
    const pages = await getCollection('pages');
    pathsCache = new Set(pages.map((p) => p.data.path));
  }
  return pathsCache;
}

/** URL interne d'une page opérateur si elle existe : type = '' | 'apk' | 'code-promo' | 'inscription'. */
export function operatorPath(slug: string, type = ''): string {
  // Schéma « à la casino.ru » : URL plates, slug = requête principale dans l'ordre le plus recherché.
  if (type === 'apk') return `/${slug}-apk/`;                 // « 1xbet apk »
  if (type === 'code-promo') return `/code-promo-${slug}/`;   // « code promo 1xbet »
  if (type === 'inscription') return `/${slug}-inscription/`; // « 1xbet inscription »
  return `/${slug}/`;                                          // avis
}

export async function pageUrl(slug: string, type = ''): Promise<string> {
  const path = operatorPath(slug, type);
  return (await existingPaths()).has(path) ? path : '';
}

/** Lien partenaire /go/ (redirection 302 générée au build). */
export function goUrl(slug: string, type = ''): string {
  const suffix = type === 'apk' ? '-apk' : type === 'promo' || type === 'code-promo' ? '-promo' : '';
  return `/go/${slug}${suffix}/`;
}

export function goTargets(): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  for (const o of operators) {
    const home = o.url || site.url + '/';
    out.push({ from: `/go/${o.slug}/`, to: home });
    out.push({ from: `/go/${o.slug}-apk/`, to: o.url_apk || home });
    out.push({ from: `/go/${o.slug}-promo/`, to: o.url_promo || home });
  }
  return out;
}

export const fmtRating = (r: number) => r.toFixed(1).replace('.', ',');

export function ctaLabel(type: string, name: string): string {
  if (type === 'apk') return `Télécharger l'app ${name}`;
  if (type === 'promo' || type === 'code-promo') return `Activer le bonus ${name}`;
  if (type === 'inscription') return `S'inscrire sur ${name}`;
  return `Visiter ${name}`;
}
