import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';
import { adhikaramsOfIyal, iyal, paal } from '../core/corpus';
import { Seo } from '../core/seo';

@Component({
  selector: 'app-iyal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    @if (current(); as item) {
      <div class="page">
        <nav class="breadcrumb" aria-label="தடம்">
          <a [routerLink]="['/paal', item.paal]">{{ paalName() }}</a>
        </nav>

        <header class="page-head">
          <h1 class="page-title">{{ item.id }}. {{ item.name }}</h1>
          <p class="page-lede">{{ adhikarams().length }} அதிகாரங்கள்</p>
        </header>

        <ul class="stack-tight">
          @for (a of adhikarams(); track a.id) {
            <li>
              <a class="list-link" [routerLink]="['/adhikaram', a.id]">
                <span class="index">{{ a.id }}</span>
                <span class="body">
                  <span class="name">{{ a.name }}</span>
                </span>
                <app-icon class="chevron" name="chevron-right" />
              </a>
            </li>
          }
        </ul>
      </div>
    } @else {
      <div class="page empty">
        <p>இந்த இயல் கிடைக்கவில்லை.</p>
        <a class="btn btn-primary" routerLink="/iyal">இயல்கள்</a>
      </div>
    }
  `,
})
export class IyalPage {
  readonly id = input.required<string>();

  private readonly seo = inject(Seo);

  protected readonly current = computed(() => iyal(Number(this.id())) ?? null);
  protected readonly adhikarams = computed(() => adhikaramsOfIyal(Number(this.id())));
  protected readonly paalName = computed(() => paal(this.current()?.paal ?? 0)?.name ?? '');

  constructor() {
    effect(() => {
      const item = this.current();
      if (!item) return;
      this.seo.apply({
        title: `${item.name} — இயல்`,
        description: `${item.name} இயலில் உள்ள ${item.adhikarams.length} அதிகாரங்கள்.`,
        path: `/iyal/${item.id}`,
      });
    });
  }
}
