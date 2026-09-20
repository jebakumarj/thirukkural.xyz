/**
 * Packs the built site into a single tarball.
 *
 * The build is a folder of static files, so this is only a convenience for
 * moving it somewhere in one piece.
 *
 *   npm run package
 */
import { execFileSync } from 'node:child_process';
import { statSync, existsSync } from 'node:fs';

const DIST = 'dist/thirukkural/browser';

if (!existsSync(`${DIST}/index.html`) || !existsSync(`${DIST}/ngsw.json`)) {
  console.error(`error: ${DIST} does not look like a finished build — run npm run build`);
  process.exit(1);
}

const release = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace('T', '-')
  .slice(0, 15);
const archive = `thirukkural-${release}.tar.gz`;

// The trailing dot packs the contents, so the tar has no wrapping directory.
execFileSync('tar', ['-czf', archive, '-C', DIST, '.'], { stdio: 'inherit' });

const mb = (statSync(archive).size / 1024 / 1024).toFixed(1);
console.log(`\n${archive}  ${mb} MB`);
console.log(`Unpack it where your web server serves from: tar -xzf ${archive} -C /path/to/webroot\n`);
