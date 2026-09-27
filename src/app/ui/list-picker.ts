import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from './icon';
import { Favourites } from '../core/favourites';
import { Lists } from '../core/lists';

/**
 * One shared dialog, opened by setting `Lists.picking` to a kural number,
 * where the reader ticks the lists that kural belongs to or makes a new one.
 * It lives in the shell, so it only knows ids and never loads the corpus.
 */
@Component({
  selector: 'app-list-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <dialog #dialog aria-labelledby="list-picker-title" (close)="lists.picking.set(null)" (click)="onBackdropClick($event)">
      @if (kuralId(); as id) {
        <div class="sheet">
          <header>
            <div>
              <h2 id="list-picker-title">பட்டியலில் சேர்</h2>
              <p class="muted">குறள் {{ id }}</p>
            </div>
            <button type="button" class="btn-icon" aria-label="மூடு" (click)="close()">
              <app-icon name="close" />
            </button>
          </header>

          <ul class="options">
            <li>
              <label class="option">
                <input type="checkbox" [checked]="favourites.has(id)" (change)="favourites.toggle(id)" />
                <app-icon [name]="favourites.has(id) ? 'heart-filled' : 'heart'" />
                <span class="name">விருப்பம்</span>
                <span class="count">{{ favourites.count() }}</span>
              </label>
            </li>
            @for (list of lists.all(); track list.id) {
              <li>
                <label class="option">
                  <input
                    type="checkbox"
                    [checked]="list.ids.includes(id)"
                    (change)="lists.toggle(list.id, id)"
                  />
                  <app-icon name="tag" />
                  <span class="name">{{ list.name }}</span>
                  <span class="count">{{ list.ids.length }}</span>
                </label>
              </li>
            }
          </ul>

          <form class="create" (submit)="create($event)">
            <div class="field">
              <app-icon name="plus" />
              <input
                name="name"
                autocomplete="off"
                enterkeyhint="done"
                maxlength="40"
                placeholder="புதிய பட்டியல் பெயர்"
                aria-label="புதிய பட்டியல் பெயர்"
                [value]="draft()"
                (input)="draft.set($any($event.target).value)"
              />
            </div>
            <button type="submit" class="btn" [disabled]="!draft().trim()">உருவாக்கு</button>
          </form>

          <footer>
            <button type="button" class="btn btn-primary" (click)="close()">முடிந்தது</button>
          </footer>
        </div>
      }
    </dialog>
  `,
  styles: `
    dialog {
      width: 100%;
      max-width: 28rem;
      max-height: 85dvh;
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
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
    }

    h2 {
      font-size: var(--step-1);
    }

    header .muted {
      font-size: var(--step--1);
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .option {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: 2.75rem;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--text-muted);
    }

    .option:hover {
      background: var(--surface-muted);
    }

    .option input {
      width: 1.15rem;
      height: 1.15rem;
      margin: 0;
      accent-color: var(--accent);
      flex: none;
    }

    .option .name {
      flex: 1;
      min-width: 0;
      color: var(--text);
      font-weight: 600;
    }

    .option .count {
      font-size: var(--step--1);
      font-variant-numeric: tabular-nums;
    }

    .create {
      display: flex;
      gap: var(--space-2);
    }

    .create .field {
      flex: 1;
      min-width: 0;
    }

    .create .btn:disabled {
      opacity: 0.5;
      cursor: default;
    }

    footer {
      display: flex;
      justify-content: flex-end;
    }

    @media (min-width: 34rem) {
      dialog {
        margin: auto;
        border-radius: var(--radius);
      }
    }
  `,
})
export class ListPicker {
  protected readonly lists = inject(Lists);
  protected readonly favourites = inject(Favourites);

  protected readonly kuralId = computed(() => this.lists.picking());
  protected readonly draft = signal('');

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) return;
      if (this.kuralId() !== null) {
        if (!element.open) element.showModal();
      } else if (element.open) {
        element.close();
      }
    });
  }

  protected create(event: Event): void {
    event.preventDefault();
    const id = this.kuralId();
    if (id === null) return;
    if (this.lists.create(this.draft(), id)) this.draft.set('');
  }

  protected close(): void {
    this.draft.set('');
    this.lists.picking.set(null);
  }

  /** A click on the dialog element itself is a click on its backdrop. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog()?.nativeElement) this.close();
  }
}
