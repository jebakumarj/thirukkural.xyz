import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';
import { Pager } from '../ui/pager';
import { KuralCard } from '../ui/kural-card';
import { FilterChips } from '../ui/filter-chips';
import { FilterDialog } from '../ui/filter-dialog';
import { Scope, ScopeField, matchesScope } from '../ui/scope-filter';
import { ADHIKARAMS, KURALS, Kural, adhikaram, iyal, paal } from '../core/corpus';
import { Seo } from '../core/seo';

const asId = (value: string | undefined): number | null => {
  const id = Number(value);
  return value && Number.isInteger(id) && id > 0 ? id : null;
};

/** The default view: the first adhikaram, as the old app opened. */
const DEFAULT_SCOPE: Scope = { paal: null, iyal: null, adhikaram: 1 };

@Component({
  selector: 'app-kural-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, KuralCard, Pager, FilterChips, FilterDialog],
  template: `
    <div class="page">
      <!-- The page opens on the kurals themselves; the chooser is one tap away
           behind the filter icon, in a dialog. -->
      <header class="head">
        <div class="titles">
          @if (chosen(); as item) {
            <nav class="breadcrumb" aria-label="தடம்">
              <a [routerLink]="['/paal', item.paal]">{{ paalName() }}</a>
              <span aria-hidden="true">›</span>
              <a [routerLink]="['/iyal', item.iyal]">{{ iyalName() }}</a>
            </nav>
            <div class="title-row">
              <h1 class="page-title">{{ item.id }}. {{ item.name }}</h1>
              @if (item.description) {
                <button
                  type="button"
                  class="btn-icon describe"
                  [attr.aria-expanded]="descriptionOpen()"
                  aria-controls="adhikaram-description"
                  [attr.aria-label]="
                    descriptionOpen() ? 'அதிகாரக் குறிப்பை மறை' : 'அதிகாரக் குறிப்பைக் காட்டு'
                  "
                  [title]="
                    descriptionOpen() ? 'அதிகாரக் குறிப்பை மறை' : 'அதிகாரக் குறிப்பைக் காட்டு'
                  "
                  (click)="descriptionOpen.set(!descriptionOpen())"
                >
                  <app-icon [name]="descriptionOpen() ? 'chevron-up' : 'chevron-down'" />
                </button>
              }
            </div>
            @if (descriptionOpen() && item.description) {
              <p id="adhikaram-description" class="description">{{ item.description }}</p>
            }
          } @else {
            <nav class="breadcrumb" aria-label="தடம்">
              <span>{{ scopeLabel() }}</span>
            </nav>
            <h1 class="page-title">குறள்கள்</h1>
          }
        </div>

        <button
          type="button"
          class="btn-icon filter-toggle"
          [attr.aria-expanded]="filterOpen()"
          aria-haspopup="dialog"
          aria-label="அதிகாரம் தேர்ந்தெடு"
          title="பால், இயல், அதிகாரம் வாரியாகத் தேர்ந்தெடு"
          (click)="filterOpen.set(true)"
        >
          <app-icon name="filter" />
        </button>
      </header>

      <app-filter-chips
        [scope]="chipScope()"
        [count]="kurals().length"
        unit="குறள்"
        (remove)="removeFilter($event)"
      />

      <ul class="stack">
        @for (k of visible(); track k.id) {
          <li><app-kural-card [kural]="k" /></li>
        }
      </ul>

      @if (hasMore()) {
        <button type="button" class="btn" (click)="showMore()">
          <app-icon name="list" />
          மேலும் {{ remaining() }} குறள்
        </button>
      }

      @if (chosen()) {
        <app-pager
          label="அடுத்த அதிகாரம்"
          [previous]="previousTarget()"
          [next]="nextTarget()"
          (select)="step($event)"
        />
      }
    </div>

    <app-filter-dialog [(open)]="filterOpen" [(scope)]="scope" />
  `,
  styles: `
    .head {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .titles {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .describe {
      min-height: 2.25rem;
      min-width: 2.25rem;
      --icon-size: 1.1rem;
    }

    .description {
      color: var(--text-muted);
      font-size: var(--step--1);
      line-height: 1.8;
    }

    .filter-toggle {
      flex: none;
      border-color: var(--border);
      background: var(--surface);
    }
  `,
})
export class KuralBrowsePage {
  /** `/kural?adhikaram=7` and friends, so a selection can be linked to. */
  readonly paal = input<string | undefined>(undefined);
  readonly iyal = input<string | undefined>(undefined);
  readonly adhikaram = input<string | undefined>(undefined);

  private readonly router = inject(Router);
  /** Prerendering must not rewrite the URL: that emits a redirect, not a page. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly seo = inject(Seo);

  /** Compared by value so URL updates do not re-trigger themselves. */
  readonly scope = signal<Scope>(DEFAULT_SCOPE, {
    equal: (a, b) => a.paal === b.paal && a.iyal === b.iyal && a.adhikaram === b.adhikaram,
  });

  readonly filterOpen = signal(false);

  /** How many kurals to render when a whole paal or iyal is selected. */
  private readonly pageSize = 30;
  private readonly shown = signal(this.pageSize);

  protected readonly chosen = computed(() => {
    const { adhikaram: id } = this.scope();
    return id === null ? null : (adhikaram(id) ?? null);
  });

  /** The heading already names the adhikaram, so it is left out of the chips. */
  protected readonly chipScope = computed<Scope>(() => ({ ...this.scope(), adhikaram: null }));

  protected readonly descriptionOpen = signal(false);

  protected readonly paalName = computed(() => paal(this.chosen()?.paal ?? 0)?.name ?? '');
  protected readonly iyalName = computed(() => iyal(this.chosen()?.iyal ?? 0)?.name ?? '');

  /** Shown above the heading when no single adhikaram is chosen. */
  protected readonly scopeLabel = computed(() => {
    const { paal: p, iyal: i } = this.scope();
    const parts = [p === null ? null : paal(p)?.name, i === null ? null : iyal(i)?.name].filter(
      Boolean,
    );
    return parts.length ? parts.join(' › ') : 'அனைத்து அதிகாரங்களும்';
  });

  protected readonly kurals = computed<readonly Kural[]>(() =>
    KURALS.filter((k) => matchesScope(k, this.scope())),
  );

  protected readonly visible = computed(() => this.kurals().slice(0, this.shown()));
  protected readonly hasMore = computed(() => this.kurals().length > this.shown());
  protected readonly remaining = computed(() => this.kurals().length - this.shown());

  private readonly previous = computed(() => {
    const id = this.chosen()?.id;
    return id && id > 1 ? (ADHIKARAMS[id - 2] ?? null) : null;
  });

  private readonly next = computed(() => {
    const id = this.chosen()?.id;
    return id && id < ADHIKARAMS.length ? (ADHIKARAMS[id] ?? null) : null;
  });

  protected readonly previousTarget = computed(() => {
    const item = this.previous();
    return item ? { label: item.name } : null;
  });

  protected readonly nextTarget = computed(() => {
    const item = this.next();
    return item ? { label: item.name } : null;
  });

  constructor() {
    // The URL decides the scope whenever it carries one. With no parameters at
    // all the page keeps its starting scope, so clearing the filter — which
    // removes the parameters — shows the whole book rather than snapping back
    // to the first adhikaram.
    effect(() => {
      const given = [this.paal(), this.iyal(), this.adhikaram()];
      if (given.every((value) => value === undefined)) return;
      this.scope.set({
        paal: asId(this.paal()),
        iyal: asId(this.iyal()),
        adhikaram: asId(this.adhikaram()),
      });
    });

    effect(() => {
      const scope = this.scope();
      this.shown.set(this.pageSize);
      if (!this.isBrowser) return;
      void this.router.navigate([], {
        queryParams: { paal: scope.paal, iyal: scope.iyal, adhikaram: scope.adhikaram },
        replaceUrl: true,
      });
    });

    effect(() => {
      const item = this.chosen();
      this.seo.apply({
        title: item ? `குறள்கள் — ${item.name}` : 'குறள்கள்',
        description: item
          ? `${item.name} அதிகாரத்தின் பத்துக் குறள்களும் உரைகளுடன்.`
          : 'அதிகாரம் வாரியாக 1330 குறள்களையும் படியுங்கள்.',
        path: '/kural',
      });
    });
  }

  /** Dropping a wider filter drops the narrower ones inside it too. */
  protected removeFilter(field: ScopeField): void {
    this.scope.update((scope) => {
      if (field === 'paal') return { paal: null, iyal: null, adhikaram: null };
      if (field === 'iyal') return { ...scope, iyal: null, adhikaram: null };
      return { ...scope, adhikaram: null };
    });
  }

  protected showMore(): void {
    this.shown.update((count) => count + this.pageSize);
  }

  protected step(direction: 'previous' | 'next'): void {
    const target = direction === 'previous' ? this.previous() : this.next();
    if (target) this.scope.set({ paal: null, iyal: null, adhikaram: target.id });
  }
}
