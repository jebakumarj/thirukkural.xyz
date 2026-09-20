import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from '../ui/icon';
import { Seo } from '../core/seo';

/** Small page: the two ways to reach the author, and what each is for. */
@Component({
  selector: 'app-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="page">
      <header class="page-head">
        <h1 class="page-title">உதவியும் தொடர்பும்</h1>
        <p class="page-lede">
          பிழை, எழுத்துப்பிழை, கருத்து, உரிமை தொடர்பான கோரிக்கை — எதுவாயினும்
          தெரிவிக்கலாம்.
        </p>
      </header>

      <a class="card option" [href]="issuesUrl" target="_blank" rel="noopener noreferrer">
        <span class="option-icon" aria-hidden="true">
          <app-icon name="list" />
        </span>
        <span class="body">
          <span class="name">GitHub — சிக்கலைத் தெரிவிக்க</span>
          <span class="meta">
            செயலியில் பிழை, உரையில் திருத்தம், புதிய வசதிக்கான கருத்து — இவற்றைப்
            பொதுவாகப் பதிவு செய்ய.
          </span>
        </span>
        <app-icon class="chevron" name="chevron-right" />
      </a>

      <a class="card option" [href]="'mailto:' + email">
        <span class="option-icon" aria-hidden="true">
          <app-icon name="mail" />
        </span>
        <span class="body">
          <span class="name">{{ email }}</span>
          <span class="meta">
            நேரடியாக நிர்வாகியைத் தொடர்பு கொள்ள; தனிப்பட்ட அல்லது உரிமை தொடர்பான
            கோரிக்கைகளுக்கு.
          </span>
        </span>
        <app-icon class="chevron" name="chevron-right" />
      </a>

      <section class="stack-tight">
        <h2>உரைகளைப் பற்றி</h2>
        <p class="muted small">
          குறளும் அதன் உரைகளும் பல நூல்களிலும் தளங்களிலும் உள்ளவை; ஒவ்வொரு உரைக்கும்
          அதை எழுதியோருக்கே உரிமை. ஒரு உரையை நீக்கவோ வேறுவிதமாகக் குறிப்பிடவோ
          வேண்டுமெனில் மேலுள்ள முகவரிக்கு எழுதுங்கள்.
        </p>
      </section>
    </div>
  `,
  styles: `
    .option {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-4);
      color: inherit;
    }

    .option:hover {
      text-decoration: none;
      border-color: var(--border-strong);
    }

    .option-icon {
      flex: none;
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-sm);
      background: var(--accent-soft);
      color: var(--accent-text);
    }

    .body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .name {
      font-weight: 600;
    }

    .meta {
      color: var(--text-muted);
      font-size: var(--step--1);
      line-height: 1.6;
    }

    .chevron {
      flex: none;
      align-self: center;
      color: var(--text-muted);
    }

    h2 {
      font-size: var(--step-1);
    }

    .small {
      font-size: var(--step--1);
      line-height: 1.8;
    }
  `,
})
export class HelpPage {
  protected readonly email = 'admin@thirukkural.xyz';
  protected readonly issuesUrl = 'https://github.com/jebakumarj/thirukkural.xyz/issues';

  constructor() {
    inject(Seo).apply({
      title: 'உதவியும் தொடர்பும்',
      description:
        'திருக்குறள் செயலியில் பிழை, எழுத்துப்பிழை அல்லது கருத்தைத் தெரிவிக்க: GitHub அல்லது மின்னஞ்சல்.',
      path: '/help',
    });
  }
}
