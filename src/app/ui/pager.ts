import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

/** One end of a pager: a label, and either a route to follow or an event. */
export interface PagerTarget {
  readonly label: string;
  /** Router link for the target. Omit to have the pager emit instead. */
  readonly link?: readonly unknown[];
}

/**
 * Small previous/next buttons, shared by every page that steps through the
 * book. Where a target has a `link` it renders an anchor with `rel`, so
 * crawlers can follow the sequence through the prerendered pages.
 */
@Component({
  selector: 'app-pager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <nav class="pager" [attr.aria-label]="label()">
      @if (previous(); as target) {
        @if (target.link) {
          <a class="btn step" [routerLink]="target.link" rel="prev">
            <app-icon name="chevron-left" />
            <span>{{ target.label }}</span>
          </a>
        } @else {
          <button type="button" class="btn step" (click)="select.emit('previous')">
            <app-icon name="chevron-left" />
            <span>{{ target.label }}</span>
          </button>
        }
      } @else {
        <span class="spacer"></span>
      }

      <ng-content />

      @if (next(); as target) {
        @if (target.link) {
          <a class="btn step" [routerLink]="target.link" rel="next">
            <span>{{ target.label }}</span>
            <app-icon name="chevron-right" />
          </a>
        } @else {
          <button type="button" class="btn step" (click)="select.emit('next')">
            <span>{{ target.label }}</span>
            <app-icon name="chevron-right" />
          </button>
        }
      } @else {
        <span class="spacer"></span>
      }
    </nav>
  `,
  styles: `
    .pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }

    .step {
      min-height: 2.25rem;
      padding-inline: var(--space-3);
      max-width: 48%;
      --icon-size: 1rem;
    }

    /* Keeps whatever sits in the middle centred when one end is missing. */
    .spacer {
      flex: none;
      width: 2.25rem;
    }

    .step span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (max-width: 34rem) {
      .step span {
        display: none;
      }

      .step {
        min-width: 2.75rem;
        padding-inline: 0;
      }
    }
  `,
})
export class Pager {
  readonly previous = input<PagerTarget | null>(null);
  readonly next = input<PagerTarget | null>(null);
  readonly label = input('வழிசெலுத்தல்');

  /** Emitted only for targets given without a `link`. */
  readonly select = output<'previous' | 'next'>();
}
