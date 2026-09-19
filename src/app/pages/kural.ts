import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';
import { Pager } from '../ui/pager';
import { KURAL_COUNT, contextOf, kural } from '../core/corpus';
import { ALL_URAI, URAI_LABELS } from '../core/preferences';
import { Favourites } from '../core/favourites';
import { Share } from '../core/share';
import { Seo } from '../core/seo';

@Component({
  selector: 'app-kural-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Pager],
  template: `
    @if (context(); as ctx) {
      <div class="page">
        <!-- One card carries the whole kural: where it sits in the book, the
             couplet itself, and all three commentaries. -->
        <article class="card kural">
          <header class="head">
            <p>
              <span class="number">குறள்: {{ ctx.kural.id }}</span>
              <span class="divider" aria-hidden="true">|</span>
              <a [routerLink]="['/adhikaram', ctx.adhikaram.id]">
                {{ ctx.adhikaram.id }}. {{ ctx.adhikaram.name }}
              </a>
            </p>
            <p>
              <a [routerLink]="['/paal', ctx.paal.id]">{{ ctx.paal.name }}</a>
              <span class="divider" aria-hidden="true">|</span>
              <a [routerLink]="['/iyal', ctx.iyal.id]">{{ ctx.iyal.name }}</a>
            </p>
          </header>

          <h1 class="couplet">
            <span>{{ ctx.kural.lines[0] }}</span>
            <span>{{ ctx.kural.lines[1] }}</span>
          </h1>

          <div class="urai">
            @for (entry of urai(); track entry.key) {
              <section>
                <h2>{{ entry.label }}</h2>
                <p>{{ entry.text }}</p>
              </section>
            }
          </div>
        </article>

        <!-- Actions sit outside the card, centred between the two steps. -->
        <app-pager label="அடுத்த குறள்" [previous]="previousTarget()" [next]="nextTarget()">
          <div class="actions">
            <button
            type="button"
            class="btn"
            [class.btn-primary]="isFavourite()"
            [attr.aria-pressed]="isFavourite()"
            (click)="favourites.toggle(ctx.kural.id)"
          >
            <app-icon [name]="isFavourite() ? 'heart-filled' : 'heart'" />
            <span class="label">{{ isFavourite() ? 'விருப்பத்தில் உள்ளது' : 'விருப்பம்' }}</span>
          </button>
          <button type="button" class="btn" (click)="share.share(request()!)">
            <app-icon name="share" />
            <span class="label">பகிர்</span>
          </button>
          <button type="button" class="btn" (click)="share.copyKural(request()!)">
            <app-icon name="copy" />
            <span class="label">நகலெடு</span>
          </button>
          </div>
        </app-pager>

        <a class="btn" [routerLink]="['/adhikaram', ctx.adhikaram.id]">
          <app-icon name="book" />
          {{ ctx.adhikaram.name }} அதிகாரம் முழுவதும்
        </a>
      </div>
    } @else {
      <div class="page empty">
        <p>இந்தக் குறள் கிடைக்கவில்லை.</p>
        <a class="btn btn-primary" routerLink="/">முகப்புக்குச் செல்</a>
      </div>
    }
  `,
  styles: `
    .kural {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      border-inline-start: 4px solid var(--accent);
    }

    /* Same header as the list card: kural number and adhikaram on one side,
       paal and iyal on the other. */
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
      font-size: var(--step-2);
      font-weight: 700;
      line-height: 1.8;
    }

    .urai {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding-top: var(--space-3);
      border-top: 1px solid var(--border);
    }

    .urai h2 {
      font-size: var(--step--1);
      color: var(--text-muted);
      font-weight: 600;
      margin-bottom: var(--space-1);
    }

    .urai p {
      line-height: 1.8;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      min-width: 0;
    }

    /* Narrow screens keep the row intact by dropping to icons only. */
    @media (max-width: 34rem) {
      .actions .label {
        display: none;
      }

      .actions .btn {
        min-width: 2.75rem;
        padding-inline: 0;
      }
    }

  `,
})
export class KuralPage {
  /** Route parameter, bound by `withComponentInputBinding`. */
  readonly id = input.required<string>();

  private readonly seo = inject(Seo);
  protected readonly favourites = inject(Favourites);
  protected readonly share = inject(Share);

  protected readonly context = computed(() => {
    const found = kural(Number(this.id()));
    return found ? contextOf(found) : null;
  });

  protected readonly isFavourite = computed(() => {
    const ctx = this.context();
    return ctx ? this.favourites.has(ctx.kural.id) : false;
  });

  /** This page shows every commentary, so it shares and copies all three. */
  protected readonly request = computed(() => {
    const ctx = this.context();
    return ctx ? { context: ctx, urai: ALL_URAI } : null;
  });

  /** The detail page always shows every commentary — nothing to expand. */
  protected readonly urai = computed(() => {
    const ctx = this.context();
    if (!ctx) return [];
    return ALL_URAI.map((key) => ({
      key,
      label: URAI_LABELS[key],
      text: ctx.kural.urai[key],
    }));
  });

  protected readonly previousTarget = computed(() => {
    const id = this.previousId();
    return id ? { label: `குறள் ${id}`, link: ['/kural', id] } : null;
  });

  protected readonly nextTarget = computed(() => {
    const id = this.nextId();
    return id ? { label: `குறள் ${id}`, link: ['/kural', id] } : null;
  });

  protected readonly previousId = computed(() => {
    const id = this.context()?.kural.id ?? 1;
    return id > 1 ? id - 1 : null;
  });

  protected readonly nextId = computed(() => {
    const id = this.context()?.kural.id ?? KURAL_COUNT;
    return id < KURAL_COUNT ? id + 1 : null;
  });

  constructor() {
    effect(() => {
      const ctx = this.context();
      if (!ctx) return;
      const couplet = `${ctx.kural.lines[0]} ${ctx.kural.lines[1]}`;
      this.seo.apply({
        title: `குறள் ${ctx.kural.id} — ${ctx.adhikaram.name}`,
        description: `${couplet} — ${ctx.kural.urai.muva}`,
        path: `/kural/${ctx.kural.id}`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: `திருக்குறள் ${ctx.kural.id}`,
          text: couplet,
          inLanguage: 'ta',
          isPartOf: {
            '@type': 'Book',
            name: 'திருக்குறள்',
            author: { '@type': 'Person', name: 'திருவள்ளுவர்' },
          },
          about: ctx.adhikaram.name,
        },
      });
    });
  }
}
