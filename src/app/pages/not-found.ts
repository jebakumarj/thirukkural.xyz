import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KuralCard } from '../ui/kural-card';
import { kuralOfTheDay } from '../core/corpus';
import { Seo } from '../core/seo';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KuralCard],
  template: `
    <div class="page">
      <header class="page-head">
        <h1 class="page-title">பக்கம் கிடைக்கவில்லை</h1>
        <p class="page-lede">நீங்கள் தேடிய பக்கம் இங்கு இல்லை. இதோ இன்றைய குறள்.</p>
      </header>

      <app-kural-card [kural]="kural" />

      <div class="row">
        <a class="btn btn-primary" routerLink="/">முகப்பு</a>
        <a class="btn" routerLink="/search">தேடல்</a>
      </div>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
})
export class NotFoundPage {
  protected readonly kural = kuralOfTheDay();

  constructor() {
    inject(Seo).apply({
      title: 'பக்கம் கிடைக்கவில்லை',
      description: 'இந்தப் பக்கம் கிடைக்கவில்லை.',
      path: '/404',
    });
  }
}
