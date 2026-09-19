/**
 * Renders the whole icon set, plus the link-preview image, from one source.
 * Run with `npm run icons` after changing the mark.
 *
 * The logo is an ஓலைச்சுவடி plaque: a bevelled wooden board carrying two
 * engraved lines — one couplet — on a deep red ground with a woven pattern,
 * in the colours old Tamil signboards use. It is drawn as plain shapes, so it
 * needs no font.
 *
 * The link-preview image does set Tamil type, so regenerating it needs a Tamil
 * font on the machine running this script (Nirmala UI on Windows, Noto Sans
 * Tamil elsewhere). Everything it produces is committed, so an ordinary build
 * never needs one.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const RED = '#9c2114';
const RED_DEEP = '#6d1009';
const WOOD_LIGHT = '#e0a866';
const WOOD = '#c2833f';
const WOOD_EDGE = '#8a5524';
const ENGRAVED = '#5d2f10';
const TAMIL_FONT = "'Nirmala UI', 'Noto Sans Tamil', 'Latha', sans-serif";

/**
 * @param {object} options
 * @param {number} options.inset fraction of the canvas kept clear at each edge
 * @param {number} options.radius corner radius as a fraction of the canvas
 */
const icon = ({ inset, radius }) => {
  const size = 512;
  const pad = size * inset;
  const inner = size - pad * 2;

  // A board with bevelled ends, the way a carved signboard is cut.
  const boardW = inner * 0.96;
  const boardH = inner * 0.46;
  const x = pad + (inner - boardW) / 2;
  const y = pad + (inner - boardH) / 2;
  const bevel = boardW * 0.075;
  const board = [
    `M ${x + bevel} ${y}`,
    `H ${x + boardW - bevel}`,
    `L ${x + boardW} ${y + boardH / 2}`,
    `L ${x + boardW - bevel} ${y + boardH}`,
    `H ${x + bevel}`,
    `L ${x} ${y + boardH / 2}`,
    'Z',
  ].join(' ');

  const lineH = boardH * 0.13;
  const lineX = x + boardW * 0.18;
  const lineW = boardW * 0.64;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${RED}"/>
      <stop offset="1" stop-color="${RED_DEEP}"/>
    </linearGradient>
    <linearGradient id="board" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${WOOD_LIGHT}"/>
      <stop offset="1" stop-color="${WOOD}"/>
    </linearGradient>
    <pattern id="weave" width="${inner * 0.12}" height="${inner * 0.12}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="${inner * 0.12}" height="${inner * 0.12}" fill="none"/>
      <path d="M0 0 V${inner * 0.12}" stroke="#ffffff" stroke-opacity="0.07" stroke-width="${inner * 0.022}"/>
      <path d="M0 0 H${inner * 0.12}" stroke="#000000" stroke-opacity="0.07" stroke-width="${inner * 0.022}"/>
    </pattern>
  </defs>

  <rect width="${size}" height="${size}" rx="${size * radius}" fill="url(#ground)"/>
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="url(#weave)"/>

  <path d="${board}" fill="${WOOD_EDGE}" transform="translate(0, ${boardH * 0.06})"/>
  <path d="${board}" fill="url(#board)"/>

  <rect x="${lineX}" y="${y + boardH * 0.32 - lineH / 2}" width="${lineW}" height="${lineH}" rx="${lineH / 2}" fill="${ENGRAVED}"/>
  <rect x="${lineX}" y="${y + boardH * 0.66 - lineH / 2}" width="${lineW * 0.62}" height="${lineH}" rx="${lineH / 2}" fill="${ENGRAVED}"/>
</svg>`;
};

/** The link-preview card: the mark, the name, and what the site holds. */
const ogImage = () => {
  const width = 1200;
  const height = 630;
  const tile = 180;
  const tileX = (width - tile) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5e0f08"/>
      <stop offset="1" stop-color="#8d1d11"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <g transform="translate(${tileX}, 96) scale(${tile / 512})">
    ${icon({ inset: 0.08, radius: 0.22 })
      .replace(/<\/?svg[^>]*>/g, '')
      .replace(/id="ground"/, 'id="groundInner"')
      .replace(/url\(#ground\)/, 'url(#groundInner)')
      .replace(/id="board"/, 'id="boardInner"')
      .replace(/url\(#board\)/, 'url(#boardInner)')
      .replace(/id="weave"/, 'id="weaveInner"')
      .replace(/url\(#weave\)/, 'url(#weaveInner)')}
  </g>
  <text x="${width / 2}" y="${96 + tile + 120}" text-anchor="middle"
        font-family="${TAMIL_FONT}" font-size="104" fill="#ffffff">திருக்குறள்</text>
  <text x="${width / 2}" y="${96 + tile + 196}" text-anchor="middle"
        font-family="${TAMIL_FONT}" font-size="38" fill="#f0c9a0">1330 குறள்கள் · மூன்று உரைகள்</text>
</svg>`;
};

await mkdir('public/icons', { recursive: true });

const render = async (source, width, file, height = width) => {
  await sharp(Buffer.from(source))
    .resize(width, height)
    .png({ compressionLevel: 9 })
    .toFile(file);
  console.log(file.padEnd(38), `${width}x${height}`);
};

// Rounded for contexts that show the icon as-is; square and inset for Android,
// which masks it to its own shape and crops to the middle 80%.
const standard = icon({ inset: 0.1, radius: 0.22 });
const maskable = icon({ inset: 0.2, radius: 0 });

await writeFile('public/icons/icon.svg', standard, 'utf8');
await render(standard, 512, 'public/icons/icon-512.png');
await render(standard, 192, 'public/icons/icon-192.png');
await render(maskable, 512, 'public/icons/icon-512-maskable.png');
await render(maskable, 192, 'public/icons/icon-192-maskable.png');
await render(standard, 180, 'public/icons/apple-touch-icon.png');
await render(standard, 48, 'public/icons/favicon-48.png');
await render(standard, 32, 'public/icons/favicon-32.png');
await render(standard, 16, 'public/icons/favicon-16.png');
await render(ogImage(), 1200, 'public/icons/og-image.png', 630);

// A .ico wrapping a 32px PNG, which every current browser accepts and which
// stops the automatic /favicon.ico request from 404ing.
const png = await sharp(Buffer.from(standard)).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
header.writeUInt8(32, 6); // width
header.writeUInt8(32, 7); // height
header.writeUInt8(0, 8); // palette size
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // colour planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18); // offset of the image data
await writeFile('public/favicon.ico', Buffer.concat([header, png]));
console.log('public/favicon.ico'.padEnd(38), '32x32');
