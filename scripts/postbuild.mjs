// Après le build : .htaccess (redirections 302 /go/ + cache) et robots.txt dans dist/.
import { readFileSync, writeFileSync } from 'node:fs';
const ops = JSON.parse(readFileSync(new URL('../src/data/operators.json', import.meta.url)));
const meta = JSON.parse(readFileSync(new URL('../src/data/meta.json', import.meta.url)));
const home = meta.site.url + '/';
const indexable = meta.site.indexable === true; // false = site en préproduction : fermé à l'indexation
const lines = ['# Généré automatiquement par scripts/postbuild.mjs', 'RewriteEngine On', ''];
if (!indexable) lines.push('# PRÉPRODUCTION : tout le site en noindex (passer site.indexable à true dans meta.json au lancement)',
  '<IfModule mod_headers.c>', '  Header always set X-Robots-Tag "noindex, nofollow"', '</IfModule>', '');
for (const o of ops) {
  const main = o.url || home;
  for (const [suffix, url] of [['', main], ['-apk', o.url_apk || main], ['-promo', o.url_promo || main]]) {
    lines.push(`RewriteRule ^go/${o.slug.replace(/[.]/g, '\\.')}${suffix}/?$ ${url} [R=302,L,NE]`);
  }
}
lines.push('', '<FilesMatch "\\.(png|svg|jpg|webp|css|js|woff2)$">', '  Header set Cache-Control "public, max-age=2592000"', '</FilesMatch>',
  '<IfModule mod_headers.c>', '  <If "%{REQUEST_URI} =~ m#^/go/#">', '    Header set X-Robots-Tag "noindex, nofollow"', '  </If>', '</IfModule>', 'ErrorDocument 404 /404.html');
writeFileSync(new URL('../dist/.htaccess', import.meta.url), lines.join('\n') + '\n');
const robots = indexable
  ? `User-agent: *\nDisallow: /go/\n\nSitemap: ${meta.site.url}/sitemap-index.xml\n`
  : `# Préproduction : site fermé aux robots\nUser-agent: *\nDisallow: /\n`;
writeFileSync(new URL('../dist/robots.txt', import.meta.url), robots);
console.log(`postbuild [${indexable ? 'PROD indexable' : 'PRÉPROD noindex'}]: .htaccess (${ops.length * 3} redirections) + robots.txt`);
