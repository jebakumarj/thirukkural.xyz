import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { ADHIKARAMS, IYALS, Kural, PAALS } from '../core/corpus';

export type ScopeField = 'paal' | 'iyal' | 'adhikaram';

/** A narrowing of the book to one paal, iyal or adhikaram. */
export interface Scope {
  readonly paal: number | null;
  readonly iyal: number | null;
  readonly adhikaram: number | null;
}

export const EMPTY_SCOPE: Scope = { paal: null, iyal: null, adhikaram: null };

export const isScoped = (scope: Scope): boolean =>
  scope.paal !== null || scope.iyal !== null || scope.adhikaram !== null;

export const matchesScope = (kural: Kural, scope: Scope): boolean =>
  (scope.adhikaram === null || kural.adhikaram === scope.adhikaram) &&
  (scope.iyal === null || kural.iyal === scope.iyal) &&
  (scope.paal === null || kural.paal === scope.paal);

const toId = (value: string): number | null => (value === '' ? null : Number(value));

/**
 * Three dependent dropdowns — பால் → இயல் → அதிகாரம் — where choosing one
 * narrows the lists below it. Native `select` elements are deliberate: on a
 * phone they open the system picker, which handles 133 options far better than
 * anything drawn in CSS.
 */
@Component({
  selector: 'app-scope-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid">
      @if (shows('paal')) {
      <label>
        <span>பால்</span>
        <select [value]="scope().paal ?? ''" (change)="selectPaal($event)">
          <option value="">அனைத்தும்</option>
          @for (paal of paals; track paal.id) {
            <option [value]="paal.id">{{ paal.name }}</option>
          }
        </select>
      </label>
      }

      @if (shows('iyal')) {
      <label>
        <span>இயல்</span>
        <select [value]="scope().iyal ?? ''" (change)="selectIyal($event)">
          <option value="">அனைத்தும்</option>
          @for (iyal of iyalOptions(); track iyal.id) {
            <option [value]="iyal.id">{{ iyal.name }}</option>
          }
        </select>
      </label>
      }

      @if (shows('adhikaram')) {
      <label>
        <span>அதிகாரம்</span>
        <select [value]="scope().adhikaram ?? ''" (change)="selectAdhikaram($event)">
          <option value="">{{ allAdhikaramsLabel() }}</option>
          @for (adhikaram of adhikaramOptions(); track adhikaram.id) {
            <option [value]="adhikaram.id">{{ adhikaram.id }}. {{ adhikaram.name }}</option>
          }
        </select>
      </label>
      }
    </div>

    @if (showClear() && active()) {
      <button type="button" class="clear" (click)="clear()">வடிகட்டியை நீக்கு</button>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .grid {
      display: grid;
      gap: var(--space-3);
    }

    label {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      font-size: var(--step--1);
      color: var(--text-muted);
      font-weight: 600;
    }

    select {
      width: 100%;
      min-height: 2.75rem;
      padding: 0 var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      color: var(--text);
      /* 16px stops iOS Safari zooming when the picker opens. */
      font-size: max(1rem, var(--step-0));
      font-weight: 400;
    }

    select:focus-visible {
      border-color: var(--accent);
    }

    .clear {
      align-self: flex-start;
      color: var(--accent-text);
      font-size: var(--step--1);
      font-weight: 600;
      min-height: 2.25rem;
    }

    @media (min-width: 34rem) {
      .grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `,
})
export class ScopeFilter {
  readonly scope = model<Scope>(EMPTY_SCOPE);
  /** Which dropdowns to render, in case a page only narrows by one level. */
  readonly fields = input<readonly ScopeField[]>(['paal', 'iyal', 'adhikaram']);
  readonly showClear = input(true);
  /** Label for the "no adhikaram chosen" option, which differs per page. */
  readonly allAdhikaramsLabel = input('அனைத்தும்');

  protected readonly paals = PAALS;

  protected readonly active = computed(() => isScoped(this.scope()));

  protected shows(field: ScopeField): boolean {
    return this.fields().includes(field);
  }

  protected readonly iyalOptions = computed(() => {
    const { paal } = this.scope();
    return paal === null ? IYALS : IYALS.filter((iyal) => iyal.paal === paal);
  });

  protected readonly adhikaramOptions = computed(() => {
    const { paal, iyal } = this.scope();
    return ADHIKARAMS.filter(
      (a) => (paal === null || a.paal === paal) && (iyal === null || a.iyal === iyal),
    );
  });

  /** Choosing a wider scope clears the narrower ones below it. */
  protected selectPaal(event: Event): void {
    this.scope.set({
      paal: toId((event.target as HTMLSelectElement).value),
      iyal: null,
      adhikaram: null,
    });
  }

  protected selectIyal(event: Event): void {
    this.scope.update((scope) => ({
      ...scope,
      iyal: toId((event.target as HTMLSelectElement).value),
      adhikaram: null,
    }));
  }

  protected selectAdhikaram(event: Event): void {
    this.scope.update((scope) => ({
      ...scope,
      adhikaram: toId((event.target as HTMLSelectElement).value),
    }));
  }

  protected clear(): void {
    this.scope.set(EMPTY_SCOPE);
  }
}
