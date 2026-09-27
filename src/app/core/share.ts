import { Injectable, signal } from '@angular/core';
import type { KuralContext } from './corpus';
import { URAI_LABELS, UraiKey } from './preferences';
import { SITE_ORIGIN } from './seo';

/** Said alongside a shared kural, so a stranger knows where it came from. */
const PITCH = 'திருக்குறள் — 1330 குறள்களும் மூன்று உரைகளும், இணையம் இல்லாமலும் படிக்கலாம்.';

export const kuralUrl = (id: number): string => `${SITE_ORIGIN}/kural/${id}`;

/** A mouse or trackpad and no touch screen: a desktop, for sharing purposes. */
const isDesktop = (): boolean =>
  typeof matchMedia !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * The kural as plain text: the couplet, where it sits in the book, and
 * whichever commentaries the reader currently has open.
 */
export const kuralAsText = (
  context: KuralContext,
  urai: readonly UraiKey[],
  { withUrl = true } = {},
): string => {
  const { kural, adhikaram, iyal, paal } = context;
  const parts = [
    `${kural.lines[0]}\n${kural.lines[1]}`,
    `— திருக்குறள் ${kural.id} · ${adhikaram.id}. ${adhikaram.name} (${paal.name} · ${iyal.name})`,
    ...urai.map((key) => `${URAI_LABELS[key]}\n${kural.urai[key]}`),
  ];
  if (withUrl) parts.push(kuralUrl(kural.id));
  return parts.join('\n\n');
};

export interface ShareRequest {
  readonly context: KuralContext;
  /** The commentaries to include, matching what the card is showing. */
  readonly urai: readonly UraiKey[];
}

@Injectable({ providedIn: 'root' })
export class Share {
  /** Transient confirmation shown to the user after a share or copy. */
  readonly toast = signal<string>('');

  /**
   * Shares the kural as a picture. On a phone that means the share sheet, with
   * the link and a line about the app; on a desktop, where a share sheet is
   * rarely where the picture is wanted, it goes on the clipboard to paste.
   * Each steps down to the other, then to text, as the browser allows.
   */
  async share({ context, urai }: ShareRequest): Promise<void> {
    const { kural } = context;
    const url = kuralUrl(kural.id);
    const title = `திருக்குறள் ${kural.id}`;
    // The picture carries the words, so the message alongside it stays short.
    const message = `${kural.lines[0]}\n${kural.lines[1]}\n\n${PITCH}\n${url}`;
    const rendering = this.renderFile(context, urai);

    // Started before anything is awaited: the clipboard only accepts a write
    // made while the click still counts as the reader's, and Safari stops
    // counting at the first await.
    const copied = isDesktop() ? this.copyImage(rendering) : Promise.resolve(false);
    if (await copied) return;

    const file = await rendering;

    // `navigator.share` is typed as always present but is missing on desktop
    // Firefox and in the prerenderer, so it is checked by name.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      if (file && navigator.canShare?.({ files: [file] })) {
        if (await this.attempt({ files: [file], title, text: message })) return;
      }
      if (await this.attempt({ title, text: message, url })) return;
    }

    // No share sheet on a phone: try the clipboard there too.
    if (!isDesktop() && file && (await this.copyImage(Promise.resolve(file)))) return;
    await this.copy(kuralAsText(context, urai));
  }

  /** Copies the couplet and the commentaries the card is showing. */
  async copyKural({ context, urai }: ShareRequest): Promise<void> {
    await this.copy(kuralAsText(context, urai));
  }

  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.announce('நகலெடுக்கப்பட்டது');
    } catch {
      this.announce('நகலெடுக்க முடியவில்லை');
    }
  }

  /** Loaded on demand: the drawing code is only needed when sharing. */
  private async renderFile(
    context: KuralContext,
    urai: readonly UraiKey[],
  ): Promise<File | null> {
    try {
      const { renderKuralImage } = await import('./kural-image');
      const blob = await renderKuralImage(context, urai);
      return blob
        ? new File([blob], `thirukkural-${context.kural.id}.png`, { type: 'image/png' })
        : null;
    } catch {
      return null;
    }
  }

  private async attempt(data: ShareData): Promise<boolean> {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      // A cancelled share sheet is finished business, not a failure to retry.
      if (error instanceof DOMException && error.name === 'AbortError') return true;
      return false;
    }
  }

  /**
   * Puts the picture alone on the clipboard. Adding a text version alongside
   * it would make most paste targets — chat boxes, documents, mail — take the
   * text and drop the picture; the picture already carries the words and the
   * address. The item takes the file as a promise so the write can begin
   * before the drawing has finished.
   */
  private async copyImage(file: Promise<File | null>): Promise<boolean> {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) return false;
    try {
      const png = file.then((f) => {
        if (!f) throw new Error('No picture to copy');
        return f;
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      this.announce('படம் நகலெடுக்கப்பட்டது — ஒட்டலாம்');
      return true;
    } catch {
      return false;
    }
  }

  private announce(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(''), 2400);
  }
}
