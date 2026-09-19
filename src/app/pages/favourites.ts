import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KuralCard } from '../ui/kural-card';
import { KURALS } from '../core/corpus';
import { Favourites } from '../core/favourites';
import { Seo } from '../core/seo';

@Component({
  selector: 'app-favourites',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KuralCard],
  template: `
    <div class="page">
      <header class="page-head">
        <h1 class="page-title">விருப்பக் குறள்கள்</h1>
        <p class="page-lede">இந்த உலாவியில் மட்டும் சேமிக்கப்படுகிறது</p>
      </header>

      @if (saved(); as list) {
        @if (list.length) {
          <ul class="stack">
            @for (k of list; track k.id) {
              <li><app-kural-card [kural]="k" /></li>
            }
          </ul>
          <button type="button" class="btn" (click)="favourites.clear()">அனைத்தையும் நீக்கு</button>
        } @else {
          <div class="empty card">
            <p>இன்னும் எந்தக் குறளும் சேமிக்கப்படவில்லை.</p>
            <p class="muted">குறள் அட்டையில் உள்ள இதயக் குறியீட்டை அழுத்தி சேர்க்கலாம்.</p>
            <a class="btn btn-primary" routerLink="/search">குறள் தேடு</a>
          </div>
        }
      }
    </div>
  `,
})
export class FavouritesPage {
  protected readonly favourites = inject(Favourites);

  protected readonly saved = computed(() => {
    const ids = new Set(this.favourites.ids());
    return KURALS.filter((k) => ids.has(k.id));
  });

  constructor() {
    inject(Seo).apply({
      title: 'விருப்பக் குறள்கள்',
      description: 'நீங்கள் சேமித்த குறள்கள், இந்த உலாவியில் இணையம் இல்லாமலும் கிடைக்கும்.',
      path: '/favourites',
    });
  }
}
