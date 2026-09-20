import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { readStored, writeStored } from './storage';

/** The `beforeinstallprompt` event, which TypeScript's DOM lib does not model. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'tk.install.dismissed';

/** Once turned down, the suggestion stays away for a month. */
const QUIET_DAYS = 30;

/**
 * Whether to suggest installing the app, and how.
 *
 * Chrome and Edge, on both desktop and Android, hand over a
 * `beforeinstallprompt` event that can be replayed on a click. Safari on iOS
 * has no such event, so there the app explains the Share → Add to Home Screen
 * route instead.
 */
@Injectable({ providedIn: 'root' })
export class Install {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly event = signal<InstallPromptEvent | null>(null);
  private readonly installed = signal(false);
  private readonly dismissedAt = signal<number>(Number(readStored(DISMISSED_KEY) ?? 0));

  /** True where the browser will let us raise the install dialog directly. */
  readonly canPrompt = computed(() => this.event() !== null);

  readonly isIos = signal(false);

  /** True when the app is already running from the home screen or dock. */
  readonly isStandalone = signal(false);

  /** Whether the banner should be on screen at all. */
  readonly shouldSuggest = computed(() => {
    if (!this.isBrowser || this.isStandalone() || this.installed()) return false;
    const quietUntil = this.dismissedAt() + QUIET_DAYS * 86_400_000;
    if (Date.now() < quietUntil) return false;
    return this.canPrompt() || this.isIos();
  });

  constructor() {
    if (!this.isBrowser) return;

    this.isStandalone.set(
      matchMedia('(display-mode: standalone)').matches ||
        // Safari's own flag, which predates the media query.
        (navigator as { standalone?: boolean }).standalone === true,
    );
    this.isIos.set(
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        // iPadOS reports itself as a Mac, but a touchscreen gives it away.
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    );

    addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.event.set(event as InstallPromptEvent);
    });
    addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.event.set(null);
    });
  }

  /** Raises the browser's install dialog. Resolves once the reader answers. */
  async prompt(): Promise<void> {
    const event = this.event();
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    this.event.set(null);
    if (outcome === 'dismissed') this.dismiss();
  }

  dismiss(): void {
    const now = Date.now();
    this.dismissedAt.set(now);
    writeStored(DISMISSED_KEY, String(now));
  }
}
