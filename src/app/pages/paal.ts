import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';
import { adhikaramsOfIyal, iyalsOfPaal, paal } from '../core/corpus';
import { Seo } from '../core/seo';

@Component({
  selector: 'app-paal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    @if (current(); as item) {
      <div class="page">
        <header class="page-head">
          <h1 class="page-title">{{ item.id }}. {{ item.name }}</h1>
          <p class="description">{{ item.description }}</p>
        </header>

        @for (iyal of iyals(); track iyal.id) {
          <section class="iyal-block">
            <h2>
              <a [routerLink]="['/iyal', iyal.id]">{{ iyal.name }}</a>
            </h2>
            <ul class="stack-tight">
              @for (a of adhikarams(iyal.id); track a.id) {
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
          </section>
        }
      </div>
    } @else {
      <div class="page empty">
        <p>இந்தப் பால் கிடைக்கவில்லை.</p>
        <a class="btn btn-primary" routerLink="/paal">பால்கள்</a>
      </div>
    }
  `,
  styles: `
    .description {
      color: var(--text-muted);
      line-height: 1.8;
    }

    .iyal-block {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .iyal-block h2 {
      font-size: var(--step-1);
    }

    .iyal-block h2 a {
      color: inherit;
    }
  `,
})
export class PaalPage {
  readonly id = input.required<string>();

  private readonly seo = inject(Seo);

  protected readonly current = computed(() => paal(Number(this.id())) ?? null);
  protected readonly iyals = computed(() => iyalsOfPaal(Number(this.id())));

  constructor() {
    effect(() => {
      const item = this.current();
      if (!item) return;
      this.seo.apply({
        title: item.name,
        description: item.description,
        path: `/paal/${item.id}`,
      });
    });
  }

  protected adhikarams(iyalId: number) {
    return adhikaramsOfIyal(iyalId);
  }
}
