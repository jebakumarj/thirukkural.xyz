import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Icon } from './icon';
import { PAALS, adhikaram, adhikaramsOfIyal, iyalsOfPaal } from '../core/corpus';

/**
 * The book as a collapsible tree: பால் → இயல் → அதிகாரம். Choosing an
 * adhikaram opens the kural page for that chapter, with the tree row marked as
 * the current one.
 *
 * The branch containing the page you are on opens itself, so the tree always
 * shows where you are.
 */
@Component({
  selector: 'app-book-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <nav class="tree" aria-label="நூல் வழிசெலுத்தல்">
      @for (paal of paals; track paal.id) {
        <div class="group">
          <button
            type="button"
            class="row paal"
            [attr.aria-expanded]="isPaalOpen(paal.id)"
            (click)="togglePaal(paal.id)"
          >
            <app-icon [name]="isPaalOpen(paal.id) ? 'chevron-down' : 'chevron-right'" />
            <span class="label">{{ paal.name }}</span>
          </button>

          @if (isPaalOpen(paal.id)) {
            @for (iyal of iyals(paal.id); track iyal.id) {
              <button
                type="button"
                class="row iyal"
                [attr.aria-expanded]="isIyalOpen(iyal.id)"
                (click)="toggleIyal(iyal.id)"
              >
                <app-icon [name]="isIyalOpen(iyal.id) ? 'chevron-down' : 'chevron-right'" />
                <span class="label">{{ iyal.name }}</span>
              </button>

              @if (isIyalOpen(iyal.id)) {
                @for (item of adhikarams(iyal.id); track item.id) {
                  <!-- The kural page is the reading view; the tree is its chooser. -->
                  <a
                    class="row adhikaram"
                    routerLink="/kural"
                    [queryParams]="{ adhikaram: item.id }"
                    [class.is-active]="item.id === current()?.id"
                    [attr.aria-current]="item.id === current()?.id ? 'page' : null"
                    (click)="navigate.emit()"
                  >
                    <span class="index">{{ item.id }}</span>
                    <span class="label">{{ item.name }}</span>
                  </a>
                }
              }
            }
          }
        </div>
      }
    </nav>
  `,
  styles: `
    .tree {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: var(--step--1);
    }

    .group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    /* One row shape for all three levels: depth reads from the indent, the
       weight and the colour rather than from a different shape each time. */
    .row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      min-height: 2.25rem;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      text-align: start;
      --icon-size: 0.9rem;
    }

    .row:hover {
      background: var(--surface-muted);
      color: var(--text);
      text-decoration: none;
    }

    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .paal {
      color: var(--text);
      font-weight: 700;
    }

    .iyal {
      padding-inline-start: var(--space-4);
      font-weight: 600;
    }

    .adhikaram {
      padding-inline-start: calc(var(--space-6) + var(--space-2));
    }

    .adhikaram .index {
      flex: none;
      min-width: 1.6rem;
      font-variant-numeric: tabular-nums;
      font-size: 0.72rem;
      opacity: 0.75;
    }

    .adhikaram.is-active {
      background: var(--accent-soft);
      color: var(--accent-text);
      font-weight: 600;
    }

    .adhikaram.is-active .index {
      opacity: 1;
    }
  `,
})
export class BookNav {
  /** Emitted when a chapter is chosen, so a drawer can close itself. */
  readonly navigate = output<void>();

  private readonly router = inject(Router);

  protected readonly paals = PAALS;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
      takeUntilDestroyed(),
    ),
    { initialValue: this.router.url },
  );

  /**
   * The chapter the reader is currently on. A bare `/kural` counts as the
   * first one, because that is what the page shows by default.
   */
  protected readonly current = computed(() => {
    const url = this.url();
    const fromPath = /\/adhikaram\/(\d+)/.exec(url)?.[1];
    const fromQuery = /[?&]adhikaram=(\d+)/.exec(url)?.[1];
    const id = Number(fromPath ?? fromQuery ?? (/^\/kural(\?|$)/.test(url) ? '1' : ''));
    return id ? (adhikaram(id) ?? null) : null;
  });

  /**
   * Branches the reader has opened or closed by hand. Anything absent falls
   * back to "open if it contains the current page", so the tree can both
   * follow navigation and be overridden.
   */
  private readonly paalState = signal<ReadonlyMap<number, boolean>>(new Map());
  private readonly iyalState = signal<ReadonlyMap<number, boolean>>(new Map());

  protected iyals(paalId: number) {
    return iyalsOfPaal(paalId);
  }

  protected adhikarams(iyalId: number) {
    return adhikaramsOfIyal(iyalId);
  }

  protected isPaalOpen(id: number): boolean {
    return this.paalState().get(id) ?? this.current()?.paal === id;
  }

  protected isIyalOpen(id: number): boolean {
    return this.iyalState().get(id) ?? this.current()?.iyal === id;
  }

  protected togglePaal(id: number): void {
    const open = this.isPaalOpen(id);
    this.paalState.update((state) => new Map(state).set(id, !open));
  }

  protected toggleIyal(id: number): void {
    const open = this.isIyalOpen(id);
    this.iyalState.update((state) => new Map(state).set(id, !open));
  }
}
