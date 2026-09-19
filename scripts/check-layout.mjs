/**
 * Loads the built site in the installed Chrome at phone and desktop widths and
 * reports anything that overflows the viewport horizontally, plus tap targets
 * that are too small. Run with `npm run check:layout` after `npm run build`.
 *
 *   node scripts/check-layout.mjs [baseUrl]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4380';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((path) => existsSync(path));

const PAGES = ['/', '/kural/', '/kural/646/', '/adhikaram/', '/iyal/', '/paal/', '/search/', '/about/', '/favourites/'];

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars'],
});

let problems = 0;

for (const viewport of VIEWPORTS) {
  for (const path of PAGES) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(BASE + path, { waitUntil: 'networkidle0' });

    const report = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      const overflowing = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const box = el.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) return false;
          return box.right > width + 1 || box.left < -1;
        })
        .slice(0, 6)
        .map((el) => {
          const box = el.getBoundingClientRect();
          return `${el.tagName.toLowerCase()}.${[...el.classList].join('.') || '(no class)'} → ${Math.round(box.left)}…${Math.round(box.right)}`;
        });

      const small = [...document.querySelectorAll('a[href], button:not([disabled])')]
        .filter((el) => {
          const box = el.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && (box.height < 32 || box.width < 32);
        })
        .slice(0, 4)
        .map((el) => {
          const box = el.getBoundingClientRect();
          return `${el.tagName.toLowerCase()}.${[...el.classList].join('.') || '(no class)'} ${Math.round(box.width)}x${Math.round(box.height)}`;
        });

      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: width,
        overflowing,
        small,
      };
    });

    const scrolls = report.scrollWidth > report.clientWidth + 1;
    if (scrolls || report.overflowing.length || report.small.length) {
      problems++;
      console.log(`\n${viewport.name.padEnd(8)} ${path}`);
      if (scrolls) console.log(`  page scrolls sideways: ${report.scrollWidth} > ${report.clientWidth}`);
      for (const item of report.overflowing) console.log(`  overflows: ${item}`);
      for (const item of report.small) console.log(`  small tap target: ${item}`);
    }

    await page.close();
  }
}

await browser.close();
console.log(problems ? `\n${problems} page/viewport combinations need attention.` : '\nNo layout problems found.');
