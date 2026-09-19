import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { KuralCard } from '../ui/kural-card';
import { Icon } from '../ui/icon';
import { KURAL_COUNT, kuralOfTheDay } from '../core/corpus';
import { SITE_NAME, Seo } from '../core/seo';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KuralCard, Icon],
  template: `
    <div class="page">
      <header class="head">
        <div class="titles">
          <h1 class="page-title">இன்றைய குறள்</h1>
          <p class="page-lede">{{ today() }}</p>
        </div>

        <div class="head-actions">
          <button type="button" class="btn" (click)="surprise()">
            <app-icon name="shuffle" />
            <span>ஏதேனும் ஒரு குறள்</span>
          </button>
          <a routerLink="/about" class="btn">
            <app-icon name="info" />
            <span>நூலைப் பற்றி</span>
          </a>
        </div>
      </header>

      <app-kural-card [kural]="kural()" />
    </div>
  `,
  styles: `
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
    }

    .titles {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .head-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .head-actions .btn {
      min-height: 2.25rem;
      padding-inline: var(--space-3);
      --icon-size: 1rem;
    }
  `,
})
export class HomePage {
  private readonly router = inject(Router);

  /**
   * The page is prerendered, so the HTML carries the kural of the day the
   * build ran. The signal is re-read once the browser takes over, which is
   * what makes the reader's own date — not the build date — decide.
   */
  private readonly date = signal(new Date());
  protected readonly kural = computed(() => kuralOfTheDay(this.date()));
  protected readonly today = computed(() =>
    new Intl.DateTimeFormat('ta-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(
      this.date(),
    ),
  );

  constructor() {
    afterNextRender(() => this.date.set(new Date()));

    inject(Seo).apply({
      title: 'திருக்குறள் முழுவதும், இணையம் இல்லாமலும்',
      description:
        '1330 குறள்களும், மு.வ., சாலமன் பாப்பையா, மு. கருணாநிதி ஆகியோரின் உரைகளுடன். தேடலும் விருப்பப் பட்டியலும் இணைய இணைப்பு இல்லாமலே இயங்கும்.',
      path: '/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: 'https://thirukkural.xyz',
        inLanguage: 'ta',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://thirukkural.xyz/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    });
  }

  protected surprise(): void {
    const id = 1 + Math.floor(Math.random() * KURAL_COUNT);
    void this.router.navigate(['/kural', id]);
  }
}
