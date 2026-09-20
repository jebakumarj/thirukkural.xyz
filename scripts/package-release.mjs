/**
 * Packs the built site into a single tarball for a manual deploy, and prints
 * the commands to run on the server afterwards.
 *
 * Deploys are done by hand: this is the whole of the client side. The server
 * needs no Node, no toolchain and no SSH key of ours — just the tarball.
 *
 *   npm run package
 */
import { execFileSync } from 'node:child_process';
import { statSync, existsSync } from 'node:fs';

const DIST = 'dist/thirukkural/browser';
const DEPLOY_PATH = '/var/www/thirukkural';

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
console.log(`\n${archive}  ${mb} MB\n`);
console.log('Upload it, then unpack it into a new release on the server:\n');
console.log(`  scp ${archive} YOUR-USER@YOUR-SERVER:/tmp/`);
console.log(`  ssh YOUR-USER@YOUR-SERVER`);
console.log(`  sudo mkdir -p ${DEPLOY_PATH}/releases/${release}`);
console.log(`  sudo tar -xzf /tmp/${archive} -C ${DEPLOY_PATH}/releases/${release}`);
console.log(`  sudo chown -R www-data:www-data ${DEPLOY_PATH}/releases/${release}`);
console.log(`  sudo ln -sfn ${DEPLOY_PATH}/releases/${release} ${DEPLOY_PATH}/current.tmp`);
console.log(`  sudo mv -Tf ${DEPLOY_PATH}/current.tmp ${DEPLOY_PATH}/current`);
console.log(`  rm /tmp/${archive}\n`);
console.log('The symlink swap is the moment the new build goes live.');
