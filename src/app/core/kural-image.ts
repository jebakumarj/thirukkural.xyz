import type { KuralContext } from './corpus';
import { URAI_LABELS } from './preferences';

/**
 * Draws a kural as a shareable picture on a canvas.
 *
 * Deliberately hand-drawn rather than screenshotting the DOM: it needs no
 * library, works offline, and gives a stable result that does not change with
 * the reader's theme, font size or window width.
 */

const WIDTH = 1080;
const PAD = 72;
const EDGE = 14;

const INK = '#16202e';
const MUTED = '#5b6779';
const ACCENT = '#0b5ed7';
const ACCENT_DEEP = '#0848a8';
const PAPER = '#ffffff';
const BACKDROP = '#eef3fb';
const RULE = '#dde5f0';

const FONT = "'Mukta Malar', 'Noto Sans Tamil', sans-serif";

const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;

/** Splits text into lines that fit `maxWidth`, measured in the given font. */
const wrap = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): readonly string[] => {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
};

interface Block {
  readonly text: string;
  readonly weight: number;
  readonly size: number;
  readonly colour: string;
  readonly lineHeight: number;
  /** Space above this block. */
  readonly gap: number;
  /** Draw a horizontal rule above this block. */
  readonly rule?: boolean;
}

/** The header is one row, so it is drawn directly rather than as a block. */
const HEADER_HEIGHT = 56;

const buildBlocks = (context: KuralContext, urai: readonly (keyof typeof URAI_LABELS)[]): Block[] => {
  const { kural } = context;
  const blocks: Block[] = [
    { text: kural.lines[0], weight: 700, size: 54, colour: INK, lineHeight: 82, gap: 40, rule: true },
    { text: kural.lines[1], weight: 700, size: 54, colour: INK, lineHeight: 82, gap: 0 },
  ];

  for (const key of urai) {
    blocks.push({
      text: URAI_LABELS[key],
      weight: 600,
      size: 26,
      colour: MUTED,
      lineHeight: 40,
      gap: 40,
      rule: key === urai[0],
    });
    blocks.push({
      text: kural.urai[key],
      weight: 400,
      size: 32,
      colour: INK,
      lineHeight: 52,
      gap: 6,
    });
  }

  return blocks;
};

/** The app's mark — a bevelled signboard on red — drawn small for the footer. */
const drawMark = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void => {
  ctx.save();

  const ground = ctx.createLinearGradient(x, y, x, y + size);
  ground.addColorStop(0, '#9c2114');
  ground.addColorStop(1, '#6d1009');
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, size * 0.22);
  ctx.fill();

  const inner = size * 0.8;
  const boardW = inner * 0.96;
  const boardH = inner * 0.46;
  const bx = x + (size - boardW) / 2;
  const by = y + (size - boardH) / 2;
  const bevel = boardW * 0.075;

  const board = new Path2D();
  board.moveTo(bx + bevel, by);
  board.lineTo(bx + boardW - bevel, by);
  board.lineTo(bx + boardW, by + boardH / 2);
  board.lineTo(bx + boardW - bevel, by + boardH);
  board.lineTo(bx + bevel, by + boardH);
  board.lineTo(bx, by + boardH / 2);
  board.closePath();

  const wood = ctx.createLinearGradient(bx, by, bx, by + boardH);
  wood.addColorStop(0, '#e0a866');
  wood.addColorStop(1, '#c2833f');
  ctx.fillStyle = wood;
  ctx.fill(board);

  const lineH = boardH * 0.13;
  ctx.fillStyle = '#5d2f10';
  ctx.beginPath();
  ctx.roundRect(bx + boardW * 0.18, by + boardH * 0.32 - lineH / 2, boardW * 0.64, lineH, lineH / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(bx + boardW * 0.18, by + boardH * 0.66 - lineH / 2, boardW * 0.4, lineH, lineH / 2);
  ctx.fill();

  ctx.restore();
};

/**
 * Renders the kural as a PNG. Resolves to null where the browser cannot
 * produce one, so callers can fall back to sharing text.
 */
export const renderKuralImage = async (
  context: KuralContext,
  urai: readonly (keyof typeof URAI_LABELS)[],
): Promise<Blob | null> => {
  if (typeof document === 'undefined') return null;

  // Without this the canvas would fall back to a system font mid-draw.
  try {
    await Promise.all([
      document.fonts.load(font(400, 32)),
      document.fonts.load(font(600, 30)),
      document.fonts.load(font(700, 54)),
    ]);
  } catch {
    // Carry on with whatever the browser has.
  }

  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) return null;

  const blocks = buildBlocks(context, urai);
  const textWidth = WIDTH - PAD * 2 - EDGE;

  // First pass: lay the text out to find the height the card needs.
  const laid = blocks.map((block) => {
    measure.font = font(block.weight, block.size);
    return { block, lines: wrap(measure, block.text, textWidth) };
  });

  const footerHeight = 128;
  const bodyHeight = laid.reduce(
    (total, { block, lines }) => total + block.gap + lines.length * block.lineHeight,
    0,
  );
  const cardHeight = PAD + HEADER_HEIGHT + bodyHeight + footerHeight;
  const height = Math.round(cardHeight + PAD * 1.2);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cardTop = PAD * 0.6;
  const cardLeft = PAD * 0.6;
  const cardWidth = WIDTH - cardLeft * 2;

  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.roundRect(cardLeft, cardTop, cardWidth, height - cardTop * 2, 28);
  ctx.fill();

  // The blue edge the app's cards carry.
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.roundRect(cardLeft, cardTop, EDGE, height - cardTop * 2, [28, 0, 0, 28]);
  ctx.fill();

  const left = cardLeft + EDGE + PAD * 0.7;
  const right = cardLeft + cardWidth - PAD * 0.7;
  let y = cardTop + PAD * 0.7;

  ctx.textBaseline = 'alphabetic';

  // One header row: the kural and its adhikaram on the left, the paal and iyal
  // small on the right, as the app's own card lays them out.
  const { kural, adhikaram, iyal, paal } = context;
  y += 38;
  ctx.textAlign = 'left';
  ctx.fillStyle = ACCENT;
  ctx.font = font(600, 30);
  ctx.fillText(`குறள் ${kural.id}  |  ${adhikaram.id}. ${adhikaram.name}`, left, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = MUTED;
  ctx.font = font(400, 24);
  ctx.fillText(`${paal.name}  |  ${iyal.name}`, right, y);
  ctx.textAlign = 'left';
  y += HEADER_HEIGHT - 38;

  for (const { block, lines } of laid) {
    y += block.gap;
    if (block.rule) {
      ctx.strokeStyle = RULE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, y - block.gap / 2);
      ctx.lineTo(right, y - block.gap / 2);
      ctx.stroke();
    }
    ctx.fillStyle = block.colour;
    ctx.font = font(block.weight, block.size);
    for (const line of lines) {
      y += block.lineHeight;
      ctx.fillText(line, left, y - block.lineHeight * 0.25);
    }
  }

  // Footer: the mark and the address, so a shared picture says where it is from.
  const footerY = height - cardTop - 96;
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, footerY);
  ctx.lineTo(right, footerY);
  ctx.stroke();

  drawMark(ctx, left, footerY + 22, 52);
  ctx.fillStyle = INK;
  ctx.font = font(600, 30);
  ctx.fillText('திருக்குறள்', left + 70, footerY + 52);
  ctx.fillStyle = MUTED;
  ctx.font = font(400, 26);
  ctx.fillText('thirukkural.xyz', left + 70, footerY + 86);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
};
