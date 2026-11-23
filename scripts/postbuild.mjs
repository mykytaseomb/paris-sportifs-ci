// Après le build : .htaccess (redirections 302 /go/ + cache) et robots.txt dans dist/.
import { readFileSync, writeFileSync } from 'node:fs';
const ops = JSON.parse(readFileSync(new URL('../src/data/operators.json', import.meta.url)));
const meta = JSON.parse(readFileSync(new URL('../src/data/meta.json', import.meta.url)));
const home = meta.site.url + '/';
const indexable = meta.site.indexable === true; // false = site en préproduction : fermé à l'indexation
const lines = ['# Généré automatiquement par scripts/postbuild.mjs', 'Options -Indexes', 'RewriteEngine On', 'RewriteRule ^\.ftp-deploy - [F,L]', '',
  '# Hôte unique : www -> domaine nu, en HTTPS',
  'RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]', 'RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L,NE]',
  '# HTTP -> HTTPS (derrière Cloudflare : en-tête CF-Visitor, sans risque de boucle)',
  'RewriteCond %{HTTP:CF-Visitor} scheme\\W+http\\W*$ [NC]', 'RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L,NE]',
  '# Pages sans barre finale -> avec barre finale',
  'RewriteCond %{REQUEST_FILENAME} !-f', 'RewriteCond %{REQUEST_URI} !(\\.[a-z0-9]{2,5}|/)$ [NC]', 'RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1/ [R=301,L]', ''];
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

// Équivalents pour Cloudflare Pages / Netlify (ignorent .htaccess) : _redirects et _headers.
const redirects = [];
for (const o of ops) {
  const main = o.url || home;
  for (const [suffix, url] of [['', main], ['-apk', o.url_apk || main], ['-promo', o.url_promo || main]]) {
    redirects.push(`/go/${o.slug}${suffix}/ ${url} 302`, `/go/${o.slug}${suffix} ${url} 302`);
  }
}
writeFileSync(new URL('../dist/_redirects', import.meta.url), redirects.join('\n') + '\n');
const headers = ['/go/*', '  X-Robots-Tag: noindex, nofollow', '', '/img/*', '  Cache-Control: public, max-age=2592000', ''];
if (!indexable) headers.unshift('/*', '  X-Robots-Tag: noindex, nofollow', '');
writeFileSync(new URL('../dist/_headers', import.meta.url), headers.join('\n'));
const robots = indexable
  ? `User-agent: *\nDisallow: /go/\n\nSitemap: ${meta.site.url}/sitemap-index.xml\n`
  : `# Préproduction : site fermé aux robots\nUser-agent: *\nDisallow: /\n`;
writeFileSync(new URL('../dist/robots.txt', import.meta.url), robots);
console.log(`postbuild [${indexable ? 'PROD indexable' : 'PRÉPROD noindex'}]: .htaccess (${ops.length * 3} redirections) + robots.txt`);
