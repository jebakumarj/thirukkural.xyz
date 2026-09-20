import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'home'
  | 'book'
  | 'search'
  | 'heart'
  | 'heart-filled'
  | 'share'
  | 'copy'
  | 'sun'
  | 'moon'
  | 'auto'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'chevron-up'
  | 'close'
  | 'settings'
  | 'check'
  | 'shuffle'
  | 'list'
  | 'menu'
  | 'filter'
  | 'info'
  | 'help'
  | 'mail';

/**
 * Icons are inline SVG rather than an icon font: nothing to download, nothing
 * to flash on first paint, and they inherit the current text colour.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'icon' },
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
    }
    svg {
      display: block;
      width: var(--icon-size, 1.25rem);
      height: var(--icon-size, 1.25rem);
    }
  `,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('home') {
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5" />
        }
        @case ('book') {
          <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z" />
          <path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H19v3H5.5A1.5 1.5 0 0 1 4 19.5z" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-3.6-3.6" />
        }
        @case ('heart') {
          <path
            d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"
          />
        }
        @case ('heart-filled') {
          <path
            fill="currentColor"
            d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"
          />
        }
        @case ('share') {
          <path d="M12 15V4" />
          <path d="m8.5 7.5 3.5-3.5 3.5 3.5" />
          <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
        }
        @case ('copy') {
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4H6a2 2 0 0 0-2 2v7.5A1.5 1.5 0 0 0 5.5 15" />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        }
        @case ('moon') {
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        }
        @case ('auto') {
          <circle cx="12" cy="12" r="8.5" />
          <path fill="currentColor" stroke="none" d="M12 3.5a8.5 8.5 0 0 1 0 17z" />
        }
        @case ('chevron-right') {
          <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
        }
        @case ('chevron-left') {
          <path d="M14.5 5.5 8 12l6.5 6.5" />
        }
        @case ('chevron-down') {
          <path d="m5.5 9 6.5 6.5L18.5 9" />
        }
        @case ('chevron-up') {
          <path d="m5.5 15 6.5-6.5 6.5 6.5" />
        }
        @case ('close') {
          <path d="m6 6 12 12M18 6 6 18" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z"
          />
        }
        @case ('check') {
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        }
        @case ('shuffle') {
          <path d="M16 4h4v4" />
          <path d="M4 20 20 4" />
          <path d="M16 20h4v-4" />
          <path d="m4 4 5.5 5.5M14.5 14.5 20 20" />
        }
        @case ('list') {
          <path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20" />
          <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />
        }
        @case ('menu') {
          <path d="M4 6.5h16M4 12h16M4 17.5h16" />
        }
        @case ('filter') {
          <path d="M4 6h16l-6.2 7.2V19l-3.6-2v-3.8z" />
        }
        @case ('mail') {
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="m3.5 7 8.5 6 8.5-6" />
        }
        @case ('help') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4" />
          <path d="M12 16.7h.01" />
        }
        @case ('info') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5.5" />
          <path d="M12 7.8h.01" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
}
