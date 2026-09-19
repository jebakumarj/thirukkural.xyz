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
import { FilterChips } from '../ui/filter-chips';
import { FilterDialog } from '../ui/filter-dialog';
import { Scope } from '../ui/scope-filter';
import { IYALS, paal } from '../core/corpus';
import { Seo } from '../core/seo';

const asId = (value: string | undefined): number | null => {
  const id = Number(value);
  return value && Number.isInteger(id) && id > 0 ? id : null;
};

@Component({
  selector: 'app-iyal-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, FilterChips, FilterDialog],
  template: `
    <div class="page">
      <header class="head">
        <div class="titles">
          <h1 class="page-title">இயல்கள்</h1>
          <p class="page-lede">பால்களின் 13 உட்பிரிவுகள்</p>
        </div>

        <button
          type="button"
          class="btn-icon filter-toggle"
          [class.has-filter]="selectedPaal() !== null"
          [attr.aria-expanded]="filterOpen()"
          aria-haspopup="dialog"
          aria-label="பால் வாரியாக வடிகட்டு"
          title="பால் வாரியாக வடிகட்டு"
          (click)="filterOpen.set(true)"
        >
          <app-icon name="filter" />
        </button>
      </header>

      <app-filter-chips
        [scope]="scope()"
        [count]="visible().length"
        unit="இயல்"
        (remove)="clear()"
      />

      <ul class="stack-tight">
        @for (item of visible(); track item.id) {
          <li>
            <a class="list-link" routerLink="/adhikaram" [queryParams]="{ iyal: item.id }">
              <span class="index">{{ item.id }}</span>
              <span class="body">
                <span class="name">{{ item.name }}</span>
                <span class="meta">
                  {{ paalName(item.paal) }} · {{ item.adhikarams.length }} அதிகாரங்கள்
                </span>
              </span>
              <app-icon class="chevron" name="chevron-right" />
            </a>
          </li>
        }
      </ul>
    </div>

    <app-filter-dialog
      [(open)]="filterOpen"
      [(scope)]="scope"
      heading="பால் தேர்ந்தெடு"
      [fields]="['paal']"
    />
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

    .filter-toggle {
      flex: none;
      border-color: var(--border);
      background: var(--surface);
    }

    .filter-toggle.has-filter {
      background: var(--accent-soft);
      border-color: var(--accent-soft);
      color: var(--accent-text);
    }

  `,
})
export class IyalListPage {
  /** `/iyal?paal=1`, which is how the paal list links here. */
  readonly paal = input<string | undefined>(undefined);

  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  /** Prerendering must not rewrite the URL: that emits a redirect, not a page. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly filterOpen = signal(false);

  /** Held as a full scope so the shared filter dialog can drive it. */
  readonly scope = signal<Scope>(
    { paal: null, iyal: null, adhikaram: null },
    { equal: (a, b) => a.paal === b.paal },
  );

  protected readonly selectedPaal = computed(() => this.scope().paal);
  protected readonly selectedPaalName = computed(() => {
    const id = this.selectedPaal();
    return id === null ? null : (paal(id)?.name ?? null);
  });

  protected readonly visible = computed(() => {
    const id = this.selectedPaal();
    return id === null ? IYALS : IYALS.filter((iyal) => iyal.paal === id);
  });

  constructor() {
    effect(() => {
      const id = asId(this.paal());
      this.scope.set({ paal: id, iyal: null, adhikaram: null });
    });

    effect(() => {
      const id = this.selectedPaal();
      if (!this.isBrowser) return;
      void this.router.navigate([], { queryParams: { paal: id }, replaceUrl: true });
    });

    effect(() => {
      const name = this.selectedPaalName();
      this.seo.apply({
        title: name ? `இயல்கள் — ${name}` : 'இயல்கள்',
        description: name
          ? `${name} பாலின் இயல்களும், அவற்றின் அதிகாரங்களும்.`
          : 'திருக்குறளின் 13 இயல்களும், அவை சேர்ந்த பால்களும்.',
        path: '/iyal',
      });
    });
  }

  protected paalName(id: number): string {
    return paal(id)?.name ?? '';
  }

  protected clear(): void {
    this.scope.set({ paal: null, iyal: null, adhikaram: null });
  }
}
