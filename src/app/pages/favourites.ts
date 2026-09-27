import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';
import { KuralCard } from '../ui/kural-card';
import { KURALS } from '../core/corpus';
import { Favourites } from '../core/favourites';
import { Lists } from '../core/lists';
import { Seo } from '../core/seo';

/** What the inline name form is doing, if it is open. */
type Editing = 'new' | 'rename' | null;

@Component({
  selector: 'app-favourites',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, KuralCard],
  template: `
    <div class="page">
      <header class="page-head">
        <h1 class="page-title">விருப்பக் குறள்கள்</h1>
        <p class="page-lede">இந்த உலாவியில் மட்டும் சேமிக்கப்படுகிறது</p>
      </header>

      <!-- Favourites first, then the reader's own lists. -->
      <nav class="tabs" aria-label="பட்டியல்கள்">
        <a
          class="chip"
          routerLink="/favourites"
          [class.is-active]="!selected()"
          [attr.aria-current]="!selected() ? 'page' : null"
        >
          <app-icon name="heart" />
          விருப்பம்
          <span class="count">{{ favourites.count() }}</span>
        </a>
        @for (list of lists.all(); track list.id) {
          <a
            class="chip"
            routerLink="/favourites"
            [queryParams]="{ list: list.id }"
            [class.is-active]="selected()?.id === list.id"
            [attr.aria-current]="selected()?.id === list.id ? 'page' : null"
          >
            <app-icon name="tag" />
            {{ list.name }}
            <span class="count">{{ list.ids.length }}</span>
          </a>
        }
        <button type="button" class="chip new" (click)="startEditing('new')">
          <app-icon name="plus" />
          புதிய பட்டியல்
        </button>
      </nav>

      @if (editing(); as mode) {
        <form class="name-form" (submit)="saveName($event)">
          <div class="field">
            <app-icon [name]="mode === 'new' ? 'plus' : 'edit'" />
            <input
              name="name"
              autocomplete="off"
              enterkeyhint="done"
              maxlength="40"
              [attr.aria-label]="mode === 'new' ? 'புதிய பட்டியல் பெயர்' : 'பட்டியலின் புதிய பெயர்'"
              [placeholder]="mode === 'new' ? 'புதிய பட்டியல் பெயர்' : 'பட்டியலின் புதிய பெயர்'"
              [value]="draft()"
              (input)="draft.set($any($event.target).value)"
            />
          </div>
          <button type="button" class="btn" (click)="editing.set(null)">ரத்து</button>
          <button type="submit" class="btn btn-primary" [disabled]="!draft().trim()">
            {{ mode === 'new' ? 'உருவாக்கு' : 'சேமி' }}
          </button>
        </form>
      }

      @if (selected(); as list) {
        <div class="list-head">
          <h2>{{ list.name }}</h2>
          <button
            type="button"
            class="btn-icon"
            aria-label="பெயர் மாற்று"
            title="பெயர் மாற்று"
            (click)="startEditing('rename')"
          >
            <app-icon name="edit" />
          </button>
          <button
            type="button"
            class="btn-icon"
            aria-label="பட்டியலை நீக்கு"
            title="பட்டியலை நீக்கு"
            (click)="removeList(list.id, list.name)"
          >
            <app-icon name="trash" />
          </button>
        </div>
      }

      @if (shown(); as items) {
        @if (items.length) {
          <ul class="stack">
            @for (k of items; track k.id) {
              <li><app-kural-card [kural]="k" /></li>
            }
          </ul>
          @if (!selected()) {
            <button type="button" class="btn" (click)="favourites.clear()">அனைத்தையும் நீக்கு</button>
          }
        } @else {
          <div class="empty card">
            @if (selected()) {
              <p>இந்தப் பட்டியலில் இன்னும் குறள் இல்லை.</p>
              <p class="muted">குறள் அட்டையில் உள்ள குறிச்சொல் குறியீட்டை அழுத்தி சேர்க்கலாம்.</p>
            } @else {
              <p>இன்னும் எந்தக் குறளும் சேமிக்கப்படவில்லை.</p>
              <p class="muted">குறள் அட்டையில் உள்ள இதயக் குறியீட்டை அழுத்தி சேர்க்கலாம்.</p>
            }
            <a class="btn btn-primary" routerLink="/search">குறள் தேடு</a>
          </div>
        }
      }
    </div>
  `,
  styles: `
    /* One scrolling row on phones rather than a wrapping block of chips. */
    .tabs {
      display: flex;
      gap: var(--space-2);
      overflow-x: auto;
      scrollbar-width: none;
      margin-inline: calc(-1 * var(--gutter));
      padding-inline: var(--gutter);
      --icon-size: 1rem;
    }

    .tabs .chip {
      flex: none;
      min-height: 2.75rem;
    }

    .tabs .chip:hover {
      text-decoration: none;
      border-color: var(--border-strong);
    }

    .tabs .count {
      font-variant-numeric: tabular-nums;
      opacity: 0.8;
    }

    .tabs .new {
      border-style: dashed;
    }

    .name-form {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .name-form .field {
      flex: 1 1 14rem;
      min-width: 0;
    }

    .name-form .btn:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .list-head {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-bottom: calc(-1 * var(--space-3));
    }

    .list-head h2 {
      flex: 1;
      min-width: 0;
      font-size: var(--step-1);
    }
  `,
})
export class FavouritesPage {
  /** `?list=` query parameter, bound by `withComponentInputBinding`. */
  readonly list = input<string>();

  private readonly router = inject(Router);
  protected readonly favourites = inject(Favourites);
  protected readonly lists = inject(Lists);

  protected readonly editing = signal<Editing>(null);
  protected readonly draft = signal('');

  /** The chosen list; an unknown or missing id falls back to favourites. */
  protected readonly selected = computed(() => {
    const id = this.list();
    return id ? (this.lists.get(id) ?? null) : null;
  });

  protected readonly shown = computed(() => {
    const ids = new Set(this.selected()?.ids ?? this.favourites.ids());
    return KURALS.filter((k) => ids.has(k.id));
  });

  constructor() {
    inject(Seo).apply({
      title: 'விருப்பக் குறள்கள்',
      description: 'நீங்கள் சேமித்த குறள்கள், இந்த உலாவியில் இணையம் இல்லாமலும் கிடைக்கும்.',
      path: '/favourites',
    });
  }

  protected startEditing(mode: Exclude<Editing, null>): void {
    this.draft.set(mode === 'rename' ? (this.selected()?.name ?? '') : '');
    this.editing.set(mode);
  }

  protected saveName(event: Event): void {
    event.preventDefault();
    const current = this.selected();
    if (this.editing() === 'rename') {
      if (current) this.lists.rename(current.id, this.draft());
    } else {
      const created = this.lists.create(this.draft());
      if (created) this.router.navigate(['/favourites'], { queryParams: { list: created.id } });
    }
    this.editing.set(null);
  }

  protected removeList(id: string, name: string): void {
    if (!confirm(`"${name}" பட்டியலை நீக்கவா? இதிலுள்ள குறள்கள் விருப்பத்திலிருந்து நீங்காது.`)) return;
    this.lists.remove(id);
    this.editing.set(null);
    this.router.navigate(['/favourites']);
  }
}
