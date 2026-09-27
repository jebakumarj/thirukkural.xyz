import { Injectable, computed, effect, signal } from '@angular/core';
import { readStored, writeStored } from './storage';

const KEY = 'tk.lists';

/** A reader-named group of kurals. One kural may sit in any number of lists. */
export interface KuralList {
  readonly id: string;
  readonly name: string;
  readonly ids: readonly number[];
}

const isList = (value: unknown): value is KuralList => {
  const list = value as KuralList;
  return (
    typeof list?.id === 'string' &&
    typeof list.name === 'string' &&
    Array.isArray(list.ids)
  );
};

const parse = (raw: string | null): readonly KuralList[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isList)
      .map((list) => ({ ...list, ids: list.ids.filter((id) => typeof id === 'number') }));
  } catch {
    return [];
  }
};

/** Short, collision-safe enough for one reader's handful of lists. */
const newId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/**
 * Named lists (tags) of kural numbers, kept in this browser only, alongside
 * the single favourites list. Like `Favourites`, it stores ids only, so the
 * shell can inject it without pulling in the corpus.
 */
@Injectable({ providedIn: 'root' })
export class Lists {
  readonly all = signal<readonly KuralList[]>(parse(readStored(KEY)));

  /** The kural whose list picker is open, or null when it is closed. */
  readonly picking = signal<number | null>(null);

  readonly count = computed(() => this.all().length);

  constructor() {
    effect(() => writeStored(KEY, JSON.stringify(this.all())));
  }

  get(listId: string): KuralList | undefined {
    return this.all().find((list) => list.id === listId);
  }

  /** Whether the kural belongs to at least one list. */
  isListed(kuralId: number): boolean {
    return this.all().some((list) => list.ids.includes(kuralId));
  }

  has(listId: string, kuralId: number): boolean {
    return this.get(listId)?.ids.includes(kuralId) ?? false;
  }

  /**
   * Creates a list, or returns the existing one of the same name, optionally
   * adding a kural to it straight away. Blank names are refused.
   */
  create(name: string, kuralId?: number): KuralList | null {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = this.all().find((list) => list.name === trimmed);
    if (existing) {
      if (kuralId !== undefined && !existing.ids.includes(kuralId)) this.toggle(existing.id, kuralId);
      return this.get(existing.id) ?? null;
    }
    const list: KuralList = { id: newId(), name: trimmed, ids: kuralId === undefined ? [] : [kuralId] };
    this.all.update((lists) => [...lists, list]);
    return list;
  }

  rename(listId: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.edit(listId, (list) => ({ ...list, name: trimmed }));
  }

  remove(listId: string): void {
    this.all.update((lists) => lists.filter((list) => list.id !== listId));
  }

  toggle(listId: string, kuralId: number): void {
    this.edit(listId, (list) => ({
      ...list,
      ids: list.ids.includes(kuralId) ? list.ids.filter((id) => id !== kuralId) : [...list.ids, kuralId],
    }));
  }

  private edit(listId: string, change: (list: KuralList) => KuralList): void {
    this.all.update((lists) => lists.map((list) => (list.id === listId ? change(list) : list)));
  }
}
