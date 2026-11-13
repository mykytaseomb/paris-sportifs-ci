// Copie dist/ vers preview-local/ avec des liens relatifs, pour ouvrir le site en double-cliquant index.html.
import { cpSync, readdirSync, readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { join, relative, dirname, posix } from 'node:path';
const src = new URL('../dist/', import.meta.url).pathname, out = new URL('../preview-local/', import.meta.url).pathname;
rmSync(out, { recursive: true, force: true }); cpSync(src, out, { recursive: true });
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
for (const file of walk(out).filter((f) => f.endsWith('.html'))) {
  const rel = relative(dirname(file), out).split('\\').join('/') || '.';
  let html = readFileSync(file, 'utf8');
  html = html.replace(/(href|src)="\/(?!\/)([^"#?]*)([^"]*)"/g, (m, attr, path, rest) => {
    let p = path;
    if (attr === 'href' && (p === '' || p.endsWith('/'))) p += 'index.html';
    return `${attr}="${posix.join(rel, p)}${rest}"`;
  });
  writeFileSync(file, html);
}
console.log('preview-local/ prêt : ouvrez preview-local/index.html');
