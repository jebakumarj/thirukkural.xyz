import { Injectable, computed, effect, signal } from '@angular/core';
import { readStored, writeStored } from './storage';

const KEY = 'tk.favourites';

const parse = (raw: string | null): readonly number[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
};

/**
 * Saved kural numbers, kept in this browser only — no account, no server.
 * Deliberately stores ids rather than kurals so that the shell, which injects
 * this service, never pulls the corpus into the initial bundle.
 */
@Injectable({ providedIn: 'root' })
export class Favourites {
  readonly ids = signal<readonly number[]>(parse(readStored(KEY)));

  readonly count = computed(() => this.ids().length);

  constructor() {
    effect(() => writeStored(KEY, JSON.stringify(this.ids())));
  }

  has(id: number): boolean {
    return this.ids().includes(id);
  }

  toggle(id: number): void {
    this.ids.update((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  clear(): void {
    this.ids.set([]);
  }
}
