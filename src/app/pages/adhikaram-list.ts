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
import { Scope, ScopeField } from '../ui/scope-filter';
import { ADHIKARAMS, iyal, paal } from '../core/corpus';
import { Seo } from '../core/seo';

const asId = (value: string | undefined): number | null => {
  const id = Number(value);
  return value && Number.isInteger(id) && id > 0 ? id : null;
};

@Component({
  selector: 'app-adhikaram-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, FilterChips, FilterDialog],
  template: `
    <div class="page">
      <header class="head">
        <div class="titles">
          <h1 class="page-title">அதிகாரங்கள்</h1>
          <p class="page-lede">133 அதிகாரங்கள், ஒவ்வொன்றிலும் பத்து குறள்கள்</p>
        </div>

        <button
          type="button"
          class="btn-icon filter-toggle"
          [class.has-filter]="filtered()"
          [attr.aria-expanded]="filterOpen()"
          aria-haspopup="dialog"
          aria-label="பால், இயல் வாரியாக வடிகட்டு"
          title="பால், இயல் வாரியாக வடிகட்டு"
          (click)="filterOpen.set(true)"
        >
          <app-icon name="filter" />
        </button>
      </header>

      <app-filter-chips
        [scope]="scope()"
        [count]="visible().length"
        unit="அதிகாரம்"
        (remove)="removeFilter($event)"
      />

      <ul class="stack-tight">
        @for (item of visible(); track item.id) {
          <!-- Choosing an adhikaram opens the kural list already filtered to it. -->
          <li>
            <a class="list-link" routerLink="/kural" [queryParams]="{ adhikaram: item.id }">
              <span class="index">{{ item.id }}</span>
              <span class="body">
                <span class="name">{{ item.name }}</span>
                <span class="meta">{{ iyalName(item.iyal) }} · {{ paalName(item.paal) }}</span>
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
      heading="பால், இயல் தேர்ந்தெடு"
      [fields]="['paal', 'iyal']"
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
export class AdhikaramListPage {
  /** `/adhikaram?iyal=3`, which is how the iyal list links here. */
  readonly paal = input<string | undefined>(undefined);
  readonly iyal = input<string | undefined>(undefined);

  private readonly router = inject(Router);
  private readonly seo = inject(Seo);
  /** Prerendering must not rewrite the URL: that emits a redirect, not a page. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly filterOpen = signal(false);

  readonly scope = signal<Scope>(
    { paal: null, iyal: null, adhikaram: null },
    { equal: (a, b) => a.paal === b.paal && a.iyal === b.iyal },
  );

  protected readonly filtered = computed(() => {
    const { paal: p, iyal: i } = this.scope();
    return p !== null || i !== null;
  });

  protected readonly visible = computed(() => {
    const { paal: p, iyal: i } = this.scope();
    return ADHIKARAMS.filter((a) => (p === null || a.paal === p) && (i === null || a.iyal === i));
  });

  constructor() {
    effect(() => {
      this.scope.set({ paal: asId(this.paal()), iyal: asId(this.iyal()), adhikaram: null });
    });

    effect(() => {
      const { paal: p, iyal: i } = this.scope();
      if (!this.isBrowser) return;
      void this.router.navigate([], { queryParams: { paal: p, iyal: i }, replaceUrl: true });
    });

    effect(() => {
      const { paal: p, iyal: i } = this.scope();
      const within = i !== null ? iyal(i)?.name : p !== null ? paal(p)?.name : null;
      this.seo.apply({
        title: within ? `அதிகாரங்கள் — ${within}` : 'அதிகாரங்கள்',
        description: within
          ? `${within} பகுதியின் அதிகாரங்கள்.`
          : 'திருக்குறளின் 133 அதிகாரங்களும் பால், இயல் வாரியாக.',
        path: '/adhikaram',
      });
    });
  }

  protected iyalName(id: number): string {
    return iyal(id)?.name ?? '';
  }

  protected paalName(id: number): string {
    return paal(id)?.name ?? '';
  }

  /** Dropping a paal drops the iyal inside it too, which no longer applies. */
  protected removeFilter(field: ScopeField): void {
    this.scope.update((scope) =>
      field === 'paal'
        ? { paal: null, iyal: null, adhikaram: null }
        : { ...scope, [field]: null },
    );
  }
}
