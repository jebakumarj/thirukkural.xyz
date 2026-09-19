import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KuralCard } from '../ui/kural-card';
import { Pager } from '../ui/pager';
import { ADHIKARAMS, adhikaram, iyal, kuralsOfAdhikaram, paal } from '../core/corpus';
import { Seo } from '../core/seo';

@Component({
  selector: 'app-adhikaram-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KuralCard, Pager],
  template: `
    @if (current(); as item) {
      <div class="page">
        <nav class="breadcrumb" aria-label="தடம்">
          <a [routerLink]="['/paal', item.paal]">{{ paalName() }}</a>
          <span aria-hidden="true">›</span>
          <a [routerLink]="['/iyal', item.iyal]">{{ iyalName() }}</a>
        </nav>

        <header class="page-head">
          <h1 class="page-title">{{ item.id }}. {{ item.name }}</h1>
          @if (item.description) {
            <p class="description">{{ item.description }}</p>
          }
        </header>

        <ul class="stack">
          @for (k of kurals(); track k.id) {
            <li><app-kural-card [kural]="k" /></li>
          }
        </ul>

        <app-pager
          label="அடுத்த அதிகாரம்"
          [previous]="previousTarget()"
          [next]="nextTarget()"
        />
      </div>
    } @else {
      <div class="page empty">
        <p>இந்த அதிகாரம் கிடைக்கவில்லை.</p>
        <a class="btn btn-primary" routerLink="/adhikaram">அதிகாரங்கள்</a>
      </div>
    }
  `,
  styles: `
    .description {
      color: var(--text-muted);
      font-size: var(--step--1);
      line-height: 1.8;
    }

  `,
})
export class AdhikaramPage {
  readonly id = input.required<string>();

  private readonly seo = inject(Seo);

  protected readonly current = computed(() => adhikaram(Number(this.id())) ?? null);
  protected readonly kurals = computed(() => kuralsOfAdhikaram(Number(this.id())));
  protected readonly paalName = computed(() => paal(this.current()?.paal ?? 0)?.name ?? '');
  protected readonly iyalName = computed(() => iyal(this.current()?.iyal ?? 0)?.name ?? '');

  protected readonly previousTarget = computed(() => {
    const item = this.previous();
    return item ? { label: item.name, link: ['/adhikaram', item.id] } : null;
  });

  protected readonly nextTarget = computed(() => {
    const item = this.next();
    return item ? { label: item.name, link: ['/adhikaram', item.id] } : null;
  });

  protected readonly previous = computed(() => {
    const id = this.current()?.id ?? 1;
    return id > 1 ? (ADHIKARAMS[id - 2] ?? null) : null;
  });

  protected readonly next = computed(() => {
    const id = this.current()?.id ?? ADHIKARAMS.length;
    return id < ADHIKARAMS.length ? (ADHIKARAMS[id] ?? null) : null;
  });

  constructor() {
    effect(() => {
      const item = this.current();
      if (!item) return;
      const first = this.kurals()[0];
      this.seo.apply({
        title: `${item.name} — அதிகாரம் ${item.id}`,
        description:
          item.description ||
          `${item.name} அதிகாரத்தின் பத்து குறள்கள்: ${first ? first.lines.join(' ') : ''}`,
        path: `/adhikaram/${item.id}`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Chapter',
          name: item.name,
          position: item.id,
          inLanguage: 'ta',
          isPartOf: { '@type': 'Book', name: 'திருக்குறள்' },
        },
      });
    });
  }
}
