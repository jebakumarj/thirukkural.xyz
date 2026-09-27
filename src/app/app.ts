import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  effect,
  viewChild,
  ElementRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Icon } from './ui/icon';
import { BookNav } from './ui/book-nav';
import { InstallPrompt } from './ui/install-prompt';
import { ListPicker } from './ui/list-picker';
import { Install } from './core/install';
import { Favourites } from './core/favourites';
import { Preferences, ThemeChoice } from './core/preferences';
import { Share } from './core/share';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, BookNav, InstallPrompt, ListPicker],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly swUpdate = inject(SwUpdate);
  protected readonly preferences = inject(Preferences);
  protected readonly favourites = inject(Favourites);
  protected readonly share = inject(Share);
  protected readonly install = inject(Install);

  /** The book tree, shown as a drawer on screens too narrow for the sidebar. */
  protected readonly drawerOpen = signal(false);
  private readonly drawer = viewChild<ElementRef<HTMLDialogElement>>('drawer');

  /** Set when a newer build has been downloaded and is ready to swap in. */
  protected readonly updateReady = signal(false);

  protected readonly themeLabel = computed<Record<ThemeChoice, string>>(() => ({
    auto: 'தானியங்கி',
    light: 'ஒளி',
    dark: 'இருள்',
  }));

  constructor() {
    effect(() => {
      const element = this.drawer()?.nativeElement;
      if (!element) return;
      if (this.drawerOpen()) {
        if (!element.open) element.showModal();
      } else if (element.open) {
        element.close();
      }
    });

    if (!isPlatformBrowser(this.platformId)) return;

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') this.updateReady.set(true);
      });
    }
  }

  /** One control cycling auto → light → dark keeps the header uncluttered. */
  protected cycleTheme(): void {
    const order: readonly ThemeChoice[] = ['auto', 'light', 'dark'];
    const next = order[(order.indexOf(this.preferences.theme()) + 1) % order.length];
    this.preferences.setTheme(next);
  }

  protected reload(): void {
    location.reload();
  }

  /** A click on the dialog element itself is a click on its backdrop. */
  protected onDrawerClick(event: MouseEvent): void {
    if (event.target === this.drawer()?.nativeElement) this.drawerOpen.set(false);
  }
}
