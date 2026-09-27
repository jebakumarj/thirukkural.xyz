import type { KuralContext } from './corpus';
import { URAI_LABELS } from './preferences';

/**
 * Draws a kural as a shareable picture on a canvas.
 *
 * Deliberately hand-drawn rather than screenshotting the DOM: it needs no
 * library, works offline, and gives a stable result that does not change with
 * the reader's font size or window width. It does follow the theme: the
 * picture takes the colours the app is showing at the moment it is shared.
 */

/** Wide enough that a kural's longer line fits at a generous size. */
const WIDTH = 1280;
const PAD = 72;
/**
 * Ground left around the card for the mandalas and the border: a narrow band,
 * so the card and its text keep most of the width.
 */
const MARGIN = 44;

interface Palette {
  readonly ink: string;
  readonly muted: string;
  readonly accent: string;
  readonly paper: string;
  readonly backdrop: string;
  readonly rule: string;
  /** Opacity of the line-work around the card, a touch more on dark. */
  readonly ornament: number;
  /** The card's drop shadow. */
  readonly shadow: string;
}

/** The light theme's tokens, used as-is when the page's own cannot be read. */
const LIGHT: Palette = {
  ink: '#16202e',
  muted: '#5b6779',
  accent: '#0b5ed7',
  paper: '#ffffff',
  backdrop: '#eef3fb',
  rule: '#dde5f0',
  ornament: 0.2,
  shadow: 'rgb(16 40 80 / 0.14)',
};

/**
 * Reads the design tokens off the root element, so the picture matches
 * whichever theme is in force — chosen explicitly or taken from the system —
 * without keeping a second copy of the colours here.
 */
const currentPalette = (): Palette => {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;
  const dark = style.colorScheme === 'dark';
  return {
    ink: token('--text', LIGHT.ink),
    muted: token('--text-muted', LIGHT.muted),
    accent: token('--accent-text', LIGHT.accent),
    paper: token('--surface', LIGHT.paper),
    backdrop: token(dark ? '--bg' : '--surface-muted', LIGHT.backdrop),
    rule: token('--border', LIGHT.rule),
    ornament: dark ? 0.26 : LIGHT.ornament,
    shadow: dark ? 'rgb(0 0 0 / 0.5)' : LIGHT.shadow,
  };
};

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
  /** Never wrap: the text is already sized to fit on one line. */
  readonly nowrap?: boolean;
}

/** The header is one row, so it is drawn directly rather than as a block. */
const HEADER_HEIGHT = 56;

/** The couplet's preferred size. */
const COUPLET_SIZE = 54;

/**
 * A kural is two lines, and the picture keeps it that way: rather than wrap a
 * long line, both lines shrink together until the longer one fits. There is
 * no floor, since a floor would let a line overflow; at this picture's width
 * the longest in the book comes out at about 39px, still well above the
 * commentary's 32px, and most stay at or near full size.
 */
const coupletSize = (
  measure: CanvasRenderingContext2D,
  lines: readonly string[],
  maxWidth: number,
): number => {
  measure.font = font(700, COUPLET_SIZE);
  const widest = Math.max(...lines.map((line) => measure.measureText(line).width));
  if (widest <= maxWidth) return COUPLET_SIZE;
  return Math.floor((COUPLET_SIZE * maxWidth) / widest);
};

const buildBlocks = (
  context: KuralContext,
  urai: readonly (keyof typeof URAI_LABELS)[],
  palette: Palette,
  size: number,
): Block[] => {
  const { kural } = context;
  const { ink, muted } = palette;
  const lineHeight = Math.round(size * 1.52);
  const blocks: Block[] = [
    { text: kural.lines[0], weight: 700, size, colour: ink, lineHeight, gap: 40, rule: true, nowrap: true },
    { text: kural.lines[1], weight: 700, size, colour: ink, lineHeight, gap: 0, nowrap: true },
  ];

  for (const key of urai) {
    blocks.push({
      text: URAI_LABELS[key],
      weight: 600,
      size: 26,
      colour: muted,
      lineHeight: 40,
      gap: 40,
      rule: key === urai[0],
    });
    blocks.push({
      text: kural.urai[key],
      weight: 400,
      size: 32,
      colour: ink,
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
 * A kolam-like mandala in fine line-work: rings, two layers of petals and a
 * band of beads. Drawn faintly behind the text as ornament, never as content.
 */
const drawMandala = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void => {
  const TAU = Math.PI * 2;
  const at = (angle: number, radius: number): [number, number] => [
    cx + Math.cos(angle) * radius,
    cy + Math.sin(angle) * radius,
  ];

  /** A pointed petal from `inner` to `outer`, `spread` radians wide. */
  const petal = (angle: number, inner: number, outer: number, spread: number) => {
    const middle = (inner + outer) / 2;
    ctx.moveTo(...at(angle, inner));
    ctx.quadraticCurveTo(...at(angle - spread, middle), ...at(angle, outer));
    ctx.quadraticCurveTo(...at(angle + spread, middle), ...at(angle, inner));
  };

  ctx.beginPath();
  for (const ring of [0.12, 0.3, 0.56, 0.84, 1]) {
    ctx.moveTo(cx + r * ring, cy);
    ctx.arc(cx, cy, r * ring, 0, TAU);
  }

  // Inner flower: eight broad petals.
  for (let i = 0; i < 8; i++) petal((i / 8) * TAU, r * 0.12, r * 0.3, 0.32);

  // Outer flower: sixteen petals, with a slimmer one set inside each.
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * TAU;
    petal(angle, r * 0.3, r * 0.56, 0.17);
    petal(angle + TAU / 32, r * 0.3, r * 0.5, 0.08);
  }

  // Scalloped band between the outer rings.
  for (let i = 0; i < 32; i++) {
    const from = (i / 32) * TAU;
    ctx.moveTo(...at(from, r * 0.56));
    ctx.quadraticCurveTo(...at(from + TAU / 64, r * 0.8), ...at(from + TAU / 32, r * 0.56));
  }
  ctx.stroke();

  // Beads in the outermost band.
  ctx.beginPath();
  for (let i = 0; i < 48; i++) {
    const [x, y] = at((i / 48) * TAU, r * 0.92);
    ctx.moveTo(x + r * 0.018, y);
    ctx.arc(x, y, r * 0.018, 0, TAU);
  }
  ctx.fill();
};

/**
 * The ground around the card: a mandala on each corner of the picture, large
 * on one diagonal and small on the other, inside a beaded border. The card is
 * drawn over it afterwards, so the text always sits on plain paper.
 */
const drawBackdrop = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: Palette,
): void => {
  ctx.save();
  ctx.fillStyle = palette.backdrop;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = palette.ornament;
  ctx.strokeStyle = palette.accent;
  ctx.fillStyle = palette.accent;
  ctx.lineWidth = 1.8;
  drawMandala(ctx, 0, 0, 300);
  drawMandala(ctx, width, height, 300);
  drawMandala(ctx, width, 0, 170);
  drawMandala(ctx, 0, height, 170);

  // Beaded border with a fine rule inside it, like the edge of a kolam. Both
  // sit in the band between the picture's edge and the card.
  const beads = 12;
  const rule = 24;
  const step = 14;
  const bead = 1.8;
  ctx.beginPath();
  for (let x = beads; x <= width - beads; x += step) {
    ctx.moveTo(x + bead, beads);
    ctx.arc(x, beads, bead, 0, Math.PI * 2);
    ctx.moveTo(x + bead, height - beads);
    ctx.arc(x, height - beads, bead, 0, Math.PI * 2);
  }
  for (let y = beads + step; y <= height - beads - step; y += step) {
    ctx.moveTo(beads + bead, y);
    ctx.arc(beads, y, bead, 0, Math.PI * 2);
    ctx.moveTo(width - beads + bead, y);
    ctx.arc(width - beads, y, bead, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rule, rule, width - rule * 2, height - rule * 2, 14);
  ctx.stroke();
  ctx.restore();
};

/** The card itself: plain paper, lifted off the ground by a soft shadow. */
const drawCard = (
  ctx: CanvasRenderingContext2D,
  card: { x: number; y: number; w: number; h: number; radius: number },
  palette: Palette,
): void => {
  ctx.save();
  ctx.shadowColor = palette.shadow;
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = palette.paper;
  ctx.beginPath();
  ctx.roundRect(card.x, card.y, card.w, card.h, card.radius);
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

  const palette = currentPalette();
  // The card's inner width: inset by the margin around it and its own padding.
  const cardWidth = WIDTH - MARGIN * 2;
  const textWidth = cardWidth - PAD * 1.4;
  const size = coupletSize(measure, context.kural.lines, textWidth);
  const blocks = buildBlocks(context, urai, palette, size);

  // First pass: lay the text out to find the height the card needs.
  const laid = blocks.map((block) => {
    measure.font = font(block.weight, block.size);
    return {
      block,
      lines: block.nowrap ? [block.text] : wrap(measure, block.text, textWidth),
    };
  });

  const footerHeight = 140;
  const bodyHeight = laid.reduce(
    (total, { block, lines }) => total + block.gap + lines.length * block.lineHeight,
    0,
  );
  const cardHeight = PAD + HEADER_HEIGHT + bodyHeight + footerHeight;
  const height = Math.round(cardHeight + MARGIN * 2);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cardTop = MARGIN;
  const cardLeft = MARGIN;
  const card = { x: cardLeft, y: cardTop, w: cardWidth, h: cardHeight, radius: 28 };

  drawBackdrop(ctx, WIDTH, height, palette);
  drawCard(ctx, card, palette);

  const left = cardLeft + PAD * 0.7;
  const right = cardLeft + cardWidth - PAD * 0.7;
  let y = cardTop + PAD * 0.7;

  ctx.textBaseline = 'alphabetic';

  // One header row: the kural and its adhikaram on the left, the paal and iyal
  // small on the right, as the app's own card lays them out.
  const { kural, adhikaram, iyal, paal } = context;
  y += 38;
  ctx.textAlign = 'left';
  ctx.fillStyle = palette.accent;
  ctx.font = font(600, 30);
  ctx.fillText(`குறள் ${kural.id}  |  ${adhikaram.id}. ${adhikaram.name}`, left, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = palette.muted;
  ctx.font = font(400, 24);
  ctx.fillText(`${paal.name}  |  ${iyal.name}`, right, y);
  ctx.textAlign = 'left';
  y += HEADER_HEIGHT - 38;

  for (const { block, lines } of laid) {
    y += block.gap;
    if (block.rule) {
      ctx.strokeStyle = palette.rule;
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
  const footerY = cardTop + cardHeight - 108;
  ctx.strokeStyle = palette.rule;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, footerY);
  ctx.lineTo(right, footerY);
  ctx.stroke();

  // One row: the mark and name on the left, the address against the right edge.
  drawMark(ctx, left, footerY + 22, 52);
  ctx.fillStyle = palette.ink;
  ctx.font = font(600, 30);
  ctx.fillText('திருக்குறள்', left + 70, footerY + 58);
  ctx.textAlign = 'right';
  ctx.fillStyle = palette.muted;
  ctx.font = font(400, 26);
  ctx.fillText('thirukkural.xyz', right, footerY + 58);
  ctx.textAlign = 'left';

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
};
