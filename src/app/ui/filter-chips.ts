import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from './icon';
import { Scope, ScopeField } from './scope-filter';
import { adhikaram, iyal, paal } from '../core/corpus';

/**
 * The active filter, shown as removable chips. Each page passes its own scope
 * and drops the field the reader closes.
 */
@Component({
  selector: 'app-filter-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  // With no chips the host must leave the flow entirely: as a zero-height
  // flex item it would still take a gap on either side of itself.
  host: { '[class.has-chips]': 'chips().length' },
  template: `
    @if (chips().length) {
      <div class="chips">
        @for (chip of chips(); track chip.field) {
          <span class="chip is-active">
            {{ chip.name }}
            <button
              type="button"
              class="chip-close"
              [attr.aria-label]="chip.name + ' வடிகட்டியை நீக்கு'"
              (click)="remove.emit(chip.field)"
            >
              <app-icon name="close" />
            </button>
          </span>
        }

        @if (count() !== null) {
          <span class="count">{{ count() }} {{ unit() }}</span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: none;
    }

    :host(.has-chips) {
      display: block;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .count {
      color: var(--text-muted);
      font-size: var(--step--1);
      align-self: center;
    }

    .chip-close {
      display: inline-grid;
      place-items: center;
      margin-inline-end: calc(-1 * var(--space-1));
      color: inherit;
      --icon-size: 0.9rem;
    }

    .chip-close:hover {
      opacity: 0.7;
    }
  `,
})
export class FilterChips {
  readonly scope = input.required<Scope>();
  /** Number of results the filter leaves, shown beside the chips. */
  readonly count = input<number | null>(null);
  readonly unit = input('');
  readonly remove = output<ScopeField>();

  protected readonly chips = computed(() => {
    const { paal: p, iyal: i, adhikaram: a } = this.scope();
    return [
      p === null ? null : { field: 'paal' as const, name: paal(p)?.name },
      i === null ? null : { field: 'iyal' as const, name: iyal(i)?.name },
      a === null ? null : { field: 'adhikaram' as const, name: adhikaram(a)?.name },
    ].filter((chip): chip is { field: ScopeField; name: string } => Boolean(chip?.name));
  });
}
