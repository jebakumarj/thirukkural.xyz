/**
 * Writes sitemap.xml from the pages the build actually prerendered, so the
 * sitemap can never drift from what is deployed. Runs after `ng build`.
 */
import { readdir, writeFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = 'dist/thirukkural/browser';
const ORIGIN = 'https://thirukkural.xyz';

/** Pages that exist but should not be advertised to crawlers. */
const EXCLUDED = new Set(['favourites']);

/** Roughly how often each kind of page changes, for crawler hints. */
const priorityFor = (path) => {
  if (path === '/') return '1.0';
  if (path.startsWith('/kural/')) return '0.8';
  if (path.startsWith('/adhikaram')) return '0.7';
  return '0.5';
};

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name === 'index.html') out.push(full);
  }
  return out;
};

const files = await walk(ROOT);
const today = new Date().toISOString().slice(0, 10);

const urls = files
  .map((file) => {
    const rel = relative(ROOT, file).split(sep).slice(0, -1).join('/');
    return rel ? `/${rel}` : '/';
  })
  .filter((path) => !EXCLUDED.has(path.split('/')[1]))
  .sort();

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((path) =>
    [
      '  <url>',
      `    <loc>${ORIGIN}${path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <priority>${priorityFor(path)}</priority>`,
      '  </url>',
    ].join('\n'),
  ),
  '</urlset>',
  '',
].join('\n');

await writeFile(join(ROOT, 'sitemap.xml'), xml, 'utf8');
const { size } = await stat(join(ROOT, 'sitemap.xml'));
console.log(`sitemap.xml: ${urls.length} urls, ${(size / 1024).toFixed(0)} KB`);
