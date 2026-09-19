import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';
import { KuralCard } from '../ui/kural-card';
import { EMPTY_SCOPE, Scope, ScopeFilter, isScoped, matchesScope } from '../ui/scope-filter';
import { KURALS, KURAL_COUNT, Kural, adhikaram, iyal, kural, paal } from '../core/corpus';
import { kuralNumberIn, searchKurals } from '../core/search';
import { Seo } from '../core/seo';

const asId = (value: string | undefined): number | null => {
  const id = Number(value);
  return value && Number.isInteger(id) && id > 0 ? id : null;
};

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, KuralCard, ScopeFilter],
  template: `
    <div class="page">
      <header class="page-head">
        <h1 class="page-title">தேடல்</h1>
        <p class="page-lede">குறள், உரை, அதிகாரப் பெயர் — {{ total }} குறள்களிலும்</p>
      </header>

      <div class="search-row">
        <div class="field">
          <app-icon name="search" />
          <input
            #box
            type="search"
            name="q"
            autocomplete="off"
            enterkeyhint="search"
            placeholder="சொல் அல்லது குறள் எண்"
            aria-label="தேடல் சொல்"
            [value]="query()"
            (input)="onInput($event)"
          />
          @if (query()) {
            <button type="button" class="btn-icon" aria-label="அழி" (click)="clearQuery()">
              <app-icon name="close" />
            </button>
          }
        </div>

        <button
          type="button"
          class="btn-icon filter-toggle"
          [class.has-filter]="scoped()"
          [attr.aria-pressed]="filterOpen()"
          [attr.aria-expanded]="filterOpen()"
          aria-controls="filter-panel"
          aria-label="வடிகட்டு"
          title="பால், இயல், அதிகாரம் வாரியாக வடிகட்டு"
          (click)="filterOpen.set(!filterOpen())"
        >
          <app-icon name="filter" />
        </button>
      </div>

      @if (filterOpen()) {
        <div id="filter-panel" class="card filter-panel">
          <app-scope-filter [(scope)]="scope" />
        </div>
      }

      @if (scoped()) {
        <p class="scope-note muted">
          {{ scopeLabel() }}
          <button type="button" (click)="clearScope()">நீக்கு</button>
        </p>
      }

      @if (jumpTo(); as id) {
        <a class="list-link" [routerLink]="['/kural', id]">
          <span class="index">{{ id }}</span>
          <span class="body">
            <span class="name">குறள் {{ id }}</span>
            <span class="meta">எண்ணால் நேரடியாகச் செல்</span>
          </span>
          <app-icon class="chevron" name="chevron-right" />
        </a>
      }

      @if (searching() || scoped()) {
        <p class="muted count" role="status">
          @if (results().length) {
            {{ capped() ? limit + '+' : matchCount() }} குறள்
          } @else {
            முடிவு எதுவும் இல்லை
          }
        </p>
      }

      <ul class="stack">
        @for (k of results(); track k.id) {
          <li><app-kural-card [kural]="k" /></li>
        }
      </ul>

      @if (!searching() && !scoped()) {
        <section class="hints">
          <p class="muted">எடுத்துக்காட்டாக:</p>
          <div class="chips">
            @for (sample of samples; track sample) {
              <button type="button" class="chip" (click)="setQuery(sample)">{{ sample }}</button>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .search-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .search-row .field {
      flex: 1;
      min-width: 0;
    }

    .filter-toggle {
      border-color: var(--border);
      background: var(--surface);
    }

    .filter-toggle.has-filter {
      background: var(--accent-soft);
      border-color: var(--accent-soft);
      color: var(--accent-text);
    }

    .filter-panel {
      padding: var(--space-4);
    }

    .scope-note {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--step--1);
    }

    .scope-note button {
      color: var(--accent-text);
      font-weight: 600;
    }

    .count {
      font-size: var(--step--1);
    }

    .hints {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
})
export class SearchPage {
  /** Bound from the URL so a search, with its filter, can be shared. */
  readonly q = input<string | undefined>('');
  readonly paal = input<string | undefined>(undefined);
  readonly iyal = input<string | undefined>(undefined);
  readonly adhikaram = input<string | undefined>(undefined);

  private readonly router = inject(Router);
  /** Prerendering must not rewrite the URL: that would emit a redirect page instead of content. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly box = viewChild<ElementRef<HTMLInputElement>>('box');

  protected readonly total = KURAL_COUNT;
  protected readonly limit = 60;
  protected readonly samples = ['அன்பு', 'கல்வி', 'நட்பு', 'மழை', 'பொறுமை'];

  protected readonly query = signal('');
  /**
   * Compared by value: the URL is kept in step with this signal, and reading
   * the URL back must not look like a change, or the two would chase each
   * other.
   */
  protected readonly scope = signal<Scope>(EMPTY_SCOPE, {
    equal: (a, b) => a.paal === b.paal && a.iyal === b.iyal && a.adhikaram === b.adhikaram,
  });
  protected readonly filterOpen = signal(false);

  protected readonly scoped = computed(() => isScoped(this.scope()));
  protected readonly searching = computed(() => this.query().trim().length >= 2);

  /** Kurals inside the chosen paal/iyal/adhikaram, or the whole book. */
  private readonly inScope = computed<readonly Kural[]>(() => {
    const scope = this.scope();
    return isScoped(scope) ? KURALS.filter((k) => matchesScope(k, scope)) : KURALS;
  });

  private readonly matches = computed<readonly Kural[]>(() => {
    const scope = this.scope();
    if (this.searching()) {
      const within = isScoped(scope) ? (k: Kural) => matchesScope(k, scope) : undefined;
      // One more than the limit, so "first N of many" can be detected.
      return searchKurals(this.query(), this.limit + 1, within).map((hit) => hit.kural);
    }
    return isScoped(scope) ? this.inScope() : [];
  });

  protected readonly matchCount = computed(() => this.matches().length);
  protected readonly capped = computed(() => this.matches().length > this.limit);
  protected readonly results = computed<readonly Kural[]>(() => this.matches().slice(0, this.limit));

  protected readonly jumpTo = computed(() => {
    const id = kuralNumberIn(this.query());
    return id && kural(id) ? id : null;
  });

  protected readonly scopeLabel = computed(() => {
    const { paal: p, iyal: i, adhikaram: a } = this.scope();
    const parts = [
      p === null ? null : paal(p)?.name,
      i === null ? null : iyal(i)?.name,
      a === null ? null : adhikaram(a)?.name,
    ].filter(Boolean);
    return parts.join(' › ');
  });

  constructor() {
    inject(Seo).apply({
      title: 'தேடல்',
      description:
        '1330 குறள்களிலும் உரைகளிலும் தேடுங்கள். பால், இயல், அதிகாரம் வாரியாக வடிகட்டலாம். இணைய இணைப்பு இல்லாமலும் இயங்கும்.',
      path: '/search',
    });

    // Absent query parameters bind as undefined, not as the declared default.
    effect(() => this.query.set(this.q() ?? ''));
    effect(() => {
      const scope: Scope = {
        paal: asId(this.paal()),
        iyal: asId(this.iyal()),
        adhikaram: asId(this.adhikaram()),
      };
      this.scope.set(scope);
      if (isScoped(scope)) this.filterOpen.set(true);
    });

    // Keep the URL in step with whatever the reader has narrowed to.
    effect(() => {
      const scope = this.scope();
      const query = this.query();
      if (!this.isBrowser) return;
      void this.router.navigate([], {
        queryParams: {
          q: query || null,
          paal: scope.paal,
          iyal: scope.iyal,
          adhikaram: scope.adhikaram,
        },
        replaceUrl: true,
      });
    });

    afterNextRender(() => this.box()?.nativeElement.focus({ preventScroll: true }));
  }

  protected onInput(event: Event): void {
    this.setQuery((event.target as HTMLInputElement).value);
  }

  protected setQuery(value: string): void {
    this.query.set(value);
  }

  protected clearQuery(): void {
    this.query.set('');
    this.box()?.nativeElement.focus();
  }

  protected clearScope(): void {
    this.scope.set(EMPTY_SCOPE);
  }
}
