import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { Icon } from './icon';
import { Scope, ScopeField, ScopeFilter } from './scope-filter';

/**
 * The பால்/இயல்/அதிகாரம் chooser in a modal dialog. A native `<dialog>` gives
 * the focus trap, the Escape key and the backdrop for free; the styles turn it
 * into a bottom sheet on phones and a centred panel on wider screens.
 */
@Component({
  selector: 'app-filter-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, ScopeFilter],
  template: `
    <dialog #dialog (close)="open.set(false)" (click)="onBackdropClick($event)">
      <div class="sheet">
        <header>
          <h2>{{ heading() }}</h2>
          <button type="button" class="btn-icon" aria-label="மூடு" (click)="close()">
            <app-icon name="close" />
          </button>
        </header>

        <app-scope-filter
          [(scope)]="scope"
          [showClear]="false"
          [allAdhikaramsLabel]="allAdhikaramsLabel()"
          [fields]="fields()"
        />

        <footer>
          <button type="button" class="btn" (click)="clear()">அனைத்தும்</button>
          <button type="button" class="btn btn-primary" (click)="close()">காட்டு</button>
        </footer>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: 100%;
      max-width: 32rem;
      padding: 0;
      border: none;
      border-radius: var(--radius) var(--radius) 0 0;
      background: var(--bg-elevated);
      color: var(--text);
      box-shadow: var(--shadow-lifted);
      /* Bottom sheet on phones. */
      margin: auto auto 0;
    }

    dialog::backdrop {
      background: rgb(8 16 30 / 0.45);
      backdrop-filter: blur(2px);
    }

    dialog[open] {
      animation: sheet-in 0.18s ease;
    }

    @keyframes sheet-in {
      from {
        transform: translateY(1.5rem);
        opacity: 0;
      }
    }

    .sheet {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4);
      padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
    }

    h2 {
      font-size: var(--step-1);
    }

    footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
    }

    @media (min-width: 34rem) {
      dialog {
        margin: auto;
        border-radius: var(--radius);
      }
    }
  `,
})
export class FilterDialog {
  readonly open = model(false);
  readonly scope = model<Scope>({ paal: null, iyal: null, adhikaram: null });
  readonly heading = input('அதிகாரம் தேர்ந்தெடு');
  readonly allAdhikaramsLabel = input('அனைத்தும்');
  readonly fields = input<readonly ScopeField[]>(['paal', 'iyal', 'adhikaram']);
  readonly cleared = output<void>();

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) return;
      if (this.open()) {
        if (!element.open) element.showModal();
      } else if (element.open) {
        element.close();
      }
    });
  }

  protected close(): void {
    this.open.set(false);
  }

  protected clear(): void {
    this.scope.set({ paal: null, iyal: null, adhikaram: null });
    this.cleared.emit();
    this.close();
  }

  /** A click on the dialog element itself is a click on its backdrop. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog()?.nativeElement) this.close();
  }
}
