import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from './icon';
import { Install } from '../core/install';

/**
 * A quiet suggestion to install the app, shown once the browser says it can be
 * installed — or, on iOS, with the two taps that do it there. Dismissing it
 * puts it away for a month.
 */
@Component({
  selector: 'app-install-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (install.shouldSuggest()) {
      <aside class="prompt" role="complementary" aria-label="செயலியை நிறுவு">
        <span class="mark" aria-hidden="true">
          <img src="/icons/icon-192.png" alt="" width="40" height="40" />
        </span>

        <div class="body">
          <p class="title">செயலியாக நிறுவிக்கொள்ளுங்கள்</p>
          @if (install.isIos()) {
            <p class="detail">
              கீழுள்ள <strong>பகிர்</strong> பொத்தானை அழுத்தி
              <strong>“Add to Home Screen”</strong> என்பதைத் தேர்ந்தெடுக்கவும்.
            </p>
          } @else {
            <p class="detail">
              முகப்புத் திரையிலிருந்தே திறக்கலாம்; இணைய இணைப்பு இல்லாமலும் இயங்கும்.
            </p>
          }
        </div>

        @if (install.canPrompt()) {
          <button type="button" class="btn btn-primary act" (click)="install.prompt()">
            நிறுவு
          </button>
        }

        <button type="button" class="btn-icon close" aria-label="மூடு" (click)="install.dismiss()">
          <app-icon name="close" />
        </button>
      </aside>
    }
  `,
  styles: `
    /* Mark and text on the first row, the action on its own beneath, so the
       title has the full width to wrap into on a phone. */
    .prompt {
      position: fixed;
      z-index: 25;
      inset-inline: var(--gutter);
      /* Clear of the tab bar on phones. */
      bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom) + var(--space-3));
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: start;
      gap: var(--space-2) var(--space-3);
      max-width: 28rem;
      margin-inline: auto;
      padding: var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-elevated);
      box-shadow: var(--shadow-lifted);
      animation: prompt-in 0.2s ease;
    }

    @keyframes prompt-in {
      from {
        opacity: 0;
        transform: translateY(0.5rem);
      }
    }

    .mark {
      grid-column: 1;
      grid-row: 1;
    }

    .mark img {
      display: block;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.6rem;
    }

    .body {
      grid-column: 2;
      grid-row: 1;
      min-width: 0;
    }

    .title {
      font-weight: 600;
      line-height: 1.4;
    }

    .detail {
      color: var(--text-muted);
      font-size: var(--step--1);
      line-height: 1.5;
    }

    .act {
      grid-column: 1 / -1;
      grid-row: 2;
      justify-self: end;
      min-height: 2.25rem;
      padding-inline: var(--space-4);
    }

    .close {
      grid-column: 3;
      grid-row: 1;
      min-height: 2rem;
      min-width: 2rem;
      margin: calc(-1 * var(--space-1)) calc(-1 * var(--space-1)) 0 0;
      --icon-size: 1rem;
    }

    @media (min-width: 48rem) {
      .prompt {
        inset-inline: auto var(--space-5);
        bottom: var(--space-5);
      }
    }
  `,
})
export class InstallPrompt {
  protected readonly install = inject(Install);
}
