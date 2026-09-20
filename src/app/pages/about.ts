import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';
import { KURAL_COUNT } from '../core/corpus';
import { APP_BUILT_ON, APP_COMMIT, APP_VERSION } from '../core/version';
import { Preferences } from '../core/preferences';
import { Seo } from '../core/seo';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <div class="page">
      <header class="head">
        <h1 class="page-title">நூலைப் பற்றி</h1>
        <a class="btn home" routerLink="/">
          <app-icon name="home" />
          முகப்பு
        </a>
      </header>

      <section class="card prose">
        <p>
          திருக்குறள் திருவள்ளுவரால் இயற்றப்பட்ட தமிழ் நூல். அறத்துப்பால், பொருட்பால்,
          காமத்துப்பால் என மூன்று பால்களாகவும், 13 இயல்களாகவும், 133 அதிகாரங்களாகவும்
          பகுக்கப்பட்டு, ஒவ்வொரு அதிகாரத்திலும் பத்து குறள்கள் வீதம் மொத்தம்
          {{ total }} குறள்கள் உள்ளன.
        </p>
        <p>
          இந்தச் செயலியில் ஒவ்வொரு குறளுக்கும் மு. வரதராசனார், சாலமன் பாப்பையா,
          மு. கருணாநிதி ஆகியோரின் உரைகள் தரப்பட்டுள்ளன.
        </p>
      </section>

      <!-- Read-only: what the book contains, at a glance. -->
      <dl class="figures">
        @for (figure of figures; track figure.label) {
          <div class="figure card">
            <dt>
              <span class="value">{{ figure.value }}</span>
              <span class="label">{{ figure.label }}</span>
            </dt>
            <dd>{{ figure.detail }}</dd>
          </div>
        }
      </dl>

      <section class="stack-tight">
        <h2>உரை அமைப்பு</h2>
        <p class="muted small">
          குறள் அட்டையில் மு. வரதராசனார் உரை எப்போதும் தெரியும்; மற்ற உரைகளை
          அட்டையின் கீழுள்ள அம்புக்குறியால் திறக்கலாம்.
        </p>
        <label class="switch">
          <input
            type="checkbox"
            [checked]="preferences.uraiExpanded()"
            (change)="preferences.toggleExpanded()"
          />
          <span>அட்டைகளை மூன்று உரைகளுடன் திறந்தே காட்டு</span>
        </label>
      </section>

      <section class="stack-tight">
        <h2>இணைய இணைப்பு இல்லாமல்</h2>
        <p class="muted small">
          இந்தச் செயலி முழுவதும் உங்கள் சாதனத்தில் சேமிக்கப்படுகிறது. ஒரு முறை திறந்த பிறகு,
          இணைய இணைப்பு இல்லாமலும் அனைத்துக் குறள்களையும் படிக்கலாம், தேடலாம்.
          உலாவியின் பட்டியலிலிருந்து “Add to Home screen” என்பதைத் தேர்ந்தெடுத்து
          செயலியாக நிறுவிக்கொள்ளலாம்.
        </p>
      </section>

      <!-- Which build is running, for anyone reporting a problem. -->
      <p class="version muted">
        பதிப்பு {{ version }} · {{ builtOn }} ·
        <span class="commit">{{ commit }}</span>
      </p>
    </div>
  `,
  styles: `
    /* Title on the left, the way back on the right. */
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
    }

    .home {
      min-height: 2.25rem;
      padding-inline: var(--space-3);
      --icon-size: 1rem;
    }

    /* Two columns on a phone, four once there is room. */
    .figures {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-2);
      margin: 0;
    }

    .figure {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-3);
    }

    .figure dt {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .figure .value {
      color: var(--accent-text);
      font-size: var(--step-2);
      font-weight: 700;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }

    .figure .label {
      font-weight: 600;
    }

    .figure dd {
      margin: 0;
      color: var(--text-muted);
      font-size: var(--step--1);
      line-height: 1.5;
    }

    @media (min-width: 40rem) {
      .figures {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .prose {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      line-height: 1.85;
    }

    h2 {
      font-size: var(--step-1);
    }

    .small {
      font-size: var(--step--1);
    }

    .switch {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      min-height: 2.75rem;
      font-size: var(--step--1);
      cursor: pointer;
    }

    .switch input {
      width: 1.15rem;
      height: 1.15rem;
      accent-color: var(--accent);
    }

    .version {
      padding-top: var(--space-2);
      border-top: 1px solid var(--border);
      font-size: var(--step--1);
      font-variant-numeric: tabular-nums;
    }

    .commit {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.75rem;
    }
  `,
})
export class AboutPage {
  protected readonly total = KURAL_COUNT;
  protected readonly version = APP_VERSION;
  protected readonly commit = APP_COMMIT;
  protected readonly builtOn = APP_BUILT_ON;

  protected readonly figures = [
    { value: 3, label: 'பால்', detail: 'அறம், பொருள், இன்பம்' },
    { value: 13, label: 'இயல்', detail: 'பால்களின் உட்பிரிவுகள்' },
    { value: 133, label: 'அதிகாரம்', detail: 'பத்துக் குறள்கள் கொண்டவை' },
    { value: KURAL_COUNT, label: 'குறள்', detail: 'மூன்று உரைகளுடன்' },
  ] as const;

  protected readonly preferences = inject(Preferences);

  constructor() {
    inject(Seo).apply({
      title: 'நூலைப் பற்றி',
      description:
        'திருக்குறள் நூலைப் பற்றிய குறிப்பு, உரை அமைப்பு, இணையம் இல்லாமல் பயன்படுத்தும் முறை.',
      path: '/about',
    });
  }
}
