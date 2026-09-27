import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';
import { Kural, contextOf } from '../core/corpus';
import { Favourites } from '../core/favourites';
import { Lists } from '../core/lists';
import { ALL_URAI, PRIMARY_URAI, Preferences, SECONDARY_URAI, URAI_LABELS } from '../core/preferences';
import { Share } from '../core/share';

@Component({
  selector: 'app-kural-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <article class="card kural-card">
      <header class="head">
        <p class="where">
          <span class="number">குறள்: {{ kural().id }}</span>
          <span class="divider" aria-hidden="true">|</span>
          <a [routerLink]="['/adhikaram', context().adhikaram.id]">
            {{ context().adhikaram.id }}. {{ context().adhikaram.name }}
          </a>
        </p>
        <p class="section">
          <a [routerLink]="['/paal', context().paal.id]">{{ context().paal.name }}</a>
          <span class="divider" aria-hidden="true">|</span>
          <a [routerLink]="['/iyal', context().iyal.id]">{{ context().iyal.name }}</a>
        </p>
      </header>

      <a class="couplet" [routerLink]="['/kural', kural().id]">
        <span class="line">{{ kural().lines[0] }}</span>
        <span class="line">{{ kural().lines[1] }}</span>
      </a>

      <div class="urai">
        <section>
          <h3>{{ labels[primary] }}</h3>
          <p>{{ kural().urai[primary] }}</p>
        </section>

        @if (expanded()) {
          @for (key of secondary; track key) {
            <section>
              <h3>{{ labels[key] }}</h3>
              <p>{{ kural().urai[key] }}</p>
            </section>
          }
        }
      </div>

      @if (showActions()) {
        <div class="actions">
          <button
            type="button"
            class="btn-icon"
            [attr.aria-pressed]="isFavourite()"
            [attr.aria-label]="isFavourite() ? 'விருப்பத்திலிருந்து நீக்கு' : 'விருப்பத்தில் சேர்'"
            (click)="favourites.toggle(kural().id)"
          >
            <app-icon [name]="isFavourite() ? 'heart-filled' : 'heart'" />
          </button>
          <button
            type="button"
            class="btn-icon"
            aria-haspopup="dialog"
            [class.is-listed]="isListed()"
            aria-label="பட்டியலில் சேர்"
            title="பட்டியலில் சேர்"
            (click)="lists.picking.set(kural().id)"
          >
            <app-icon name="tag" />
          </button>
          <button
            type="button"
            class="btn-icon"
            aria-label="பகிர்"
            (click)="share.share(request())"
          >
            <app-icon name="share" />
          </button>
          <button type="button" class="btn-icon" aria-label="நகலெடு" (click)="share.copyKural(request())">
            <app-icon name="copy" />
          </button>

          <button
            type="button"
            class="btn-icon urai-toggle"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="expanded() ? 'மற்ற உரைகளை மறை' : 'அனைத்து உரைகளையும் காட்டு'"
            [title]="expanded() ? 'மற்ற உரைகளை மறை' : 'அனைத்து உரைகளையும் காட்டு'"
            (click)="toggle()"
          >
            <app-icon [name]="expanded() ? 'chevron-up' : 'chevron-down'" />
          </button>
        </div>
      }
    </article>
  `,
  styles: `
    .kural-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
    }

    /* Kural number and adhikaram on one side, paal and iyal on the other,
       as the original app laid it out. */
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-1) var(--space-3);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--border);
      font-size: var(--step--1);
      color: var(--text-muted);
    }

    .head p {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-2);
      min-width: 0;
    }

    .head a {
      color: var(--text-muted);
      font-weight: 600;
    }

    .head a:hover {
      color: var(--accent-text);
    }

    /* Comfortable touch height without disturbing the baseline row. */
    .head a {
      padding-block: 0.3rem;
      margin-block: -0.3rem;
    }

    .divider {
      color: var(--border-strong);
    }

    .number {
      color: var(--accent-text);
      font-weight: 700;
      white-space: nowrap;
    }

    .couplet {
      display: flex;
      flex-direction: column;
      color: inherit;
    }

    .couplet:hover {
      text-decoration: none;
    }

    .couplet:hover .line {
      color: var(--accent-text);
    }

    .line {
      font-size: var(--step-1);
      font-weight: 600;
      line-height: 1.75;
      transition: color 0.15s ease;
    }

    .urai {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding-top: var(--space-3);
      border-top: 1px solid var(--border);
    }

    .urai h3 {
      font-size: var(--step--1);
      color: var(--text-muted);
      font-weight: 600;
      margin-bottom: var(--space-1);
    }

    .urai p {
      font-size: var(--step-0);
      line-height: 1.75;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-top: calc(-1 * var(--space-1));
      margin-inline-start: calc(-1 * var(--space-2));
    }

    .is-listed {
      color: var(--accent-text);
    }

    .urai-toggle {
      margin-inline-start: auto;
      margin-inline-end: calc(-1 * var(--space-2));
    }
  `,
})
export class KuralCard {
  readonly kural = input.required<Kural>();
  readonly showActions = input(true);

  protected readonly labels = URAI_LABELS;
  protected readonly primary = PRIMARY_URAI;
  protected readonly secondary = SECONDARY_URAI;

  protected readonly preferences = inject(Preferences);
  protected readonly favourites = inject(Favourites);
  protected readonly lists = inject(Lists);
  protected readonly share = inject(Share);

  /** Each card opens and closes on its own, starting from the preference. */
  private readonly opened = signal<boolean | null>(null);
  protected readonly expanded = computed(() => this.opened() ?? this.preferences.uraiExpanded());

  protected readonly context = computed(() => contextOf(this.kural()));
  protected readonly isFavourite = computed(() => this.favourites.has(this.kural().id));
  protected readonly isListed = computed(() => this.lists.isListed(this.kural().id));
  /**
   * What sharing and copying act on: this kural, with exactly the commentaries
   * the card is currently showing.
   */
  protected readonly request = computed(() => ({
    context: this.context(),
    urai: this.expanded() ? ALL_URAI : [PRIMARY_URAI],
  }));

  protected toggle(): void {
    this.opened.set(!this.expanded());
  }
}
