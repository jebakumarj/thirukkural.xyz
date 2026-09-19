import { Injectable, effect, signal } from '@angular/core';
import { readStored, writeStored } from './storage';

export type ThemeChoice = 'auto' | 'light' | 'dark';
export type UraiKey = 'muva' | 'solomon' | 'kalaignar';

export const URAI_LABELS: Record<UraiKey, string> = {
  muva: 'மு. வரதராசனார் உரை',
  solomon: 'சாலமன் பாப்பையா உரை',
  kalaignar: 'மு. கருணாநிதி உரை',
};

/** The commentary shown when a card is collapsed, then the rest, in order. */
export const PRIMARY_URAI: UraiKey = 'muva';
export const SECONDARY_URAI: readonly UraiKey[] = ['solomon', 'kalaignar'];
export const ALL_URAI: readonly UraiKey[] = [PRIMARY_URAI, ...SECONDARY_URAI];

const THEME_KEY = 'tk.theme';
// Renamed so a value saved by an earlier build, when cards defaulted to open,
// cannot keep them open now that collapsed is the default.
const EXPANDED_KEY = 'tk.urai.open';

const isTheme = (value: string | null): value is ThemeChoice =>
  value === 'auto' || value === 'light' || value === 'dark';

/** Reading preferences, persisted per browser. */
@Injectable({ providedIn: 'root' })
export class Preferences {
  readonly theme = signal<ThemeChoice>(
    isTheme(readStored(THEME_KEY)) ? (readStored(THEME_KEY) as ThemeChoice) : 'auto',
  );

  /**
   * Whether a kural card starts with every commentary open. Each card keeps
   * its own state after that; this only decides where it begins.
   */
  readonly uraiExpanded = signal<boolean>(readStored(EXPANDED_KEY) === 'true');

  constructor() {
    effect(() => {
      const theme = this.theme();
      writeStored(THEME_KEY, theme);
      if (typeof document === 'undefined') return;
      document.documentElement.dataset['theme'] = theme;
      const dark =
        theme === 'dark' ||
        (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#0d1420' : '#f4f7fb');
    });
    effect(() => writeStored(EXPANDED_KEY, String(this.uraiExpanded())));
  }

  setTheme(theme: ThemeChoice): void {
    this.theme.set(theme);
  }

  toggleExpanded(): void {
    this.uraiExpanded.update((v) => !v);
  }
}
