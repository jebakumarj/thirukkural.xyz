import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PAALS, adhikaramsOfPaal } from '../core/corpus';
import { Seo } from '../core/seo';

@Component({
  selector: 'app-paal-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="page">
      <header class="page-head">
        <h1 class="page-title">பால்கள்</h1>
        <p class="page-lede">திருக்குறளின் மூன்று பெரும் பிரிவுகள்</p>
      </header>

      <ul class="stack">
        @for (item of paals; track item.id) {
          <li>
            <!-- Choosing a paal opens the iyal list already filtered to it. -->
            <a
              class="card paal-card"
              routerLink="/iyal"
              [queryParams]="{ paal: item.id }"
            >
              <h2>{{ item.id }}. {{ item.name }}</h2>
              <p class="meta">
                {{ item.iyals.length }} இயல் · {{ count(item.id) }} அதிகாரம் ·
                {{ count(item.id) * 10 }} குறள்
              </p>
              <p class="description">{{ item.description }}</p>
            </a>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .paal-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4);
      color: inherit;
    }

    .paal-card:hover {
      text-decoration: none;
      border-color: var(--border-strong);
    }

    .paal-card h2 {
      font-size: var(--step-1);
    }

    .meta {
      color: var(--text-muted);
      font-size: var(--step--1);
    }

    .description {
      color: var(--text-muted);
      line-height: 1.8;
    }

  `,
})
export class PaalListPage {
  protected readonly paals = PAALS;

  constructor() {
    inject(Seo).apply({
      title: 'பால்கள்',
      description: 'அறத்துப்பால், பொருட்பால், காமத்துப்பால் — திருக்குறளின் மூன்று பால்கள்.',
      path: '/paal',
    });
  }

  protected count(id: number): number {
    return adhikaramsOfPaal(id).length;
  }
}
