import { ADHIKARAMS, KURALS, Kural, KURAL_COUNT } from './corpus';

export type SearchField = 'kural' | 'urai' | 'adhikaram';

export interface SearchHit {
  readonly kural: Kural;
  readonly score: number;
  readonly field: SearchField;
}

/**
 * Tamil text carries punctuation and invisible joiners that users never type,
 * so both haystack and needle are flattened the same way before comparing.
 */
export const normalise = (text: string): string =>
  (text ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[.,;:!?'"“”‘’()\[\]{}\-–—/\|*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

interface IndexRow {
  readonly kural: Kural;
  readonly text: string;
  readonly urai: string;
  readonly adhikaram: string;
}

let index: readonly IndexRow[] | null = null;

/** Built once, on the first search, so it never costs anything on page load. */
const getIndex = (): readonly IndexRow[] => {
  if (index) return index;
  const adhikaramNames = new Map(ADHIKARAMS.map((a) => [a.id, normalise(a.name)]));
  index = KURALS.map((k) => ({
    kural: k,
    text: normalise(k.lines.join(' ')),
    urai: normalise(`${k.urai.muva} ${k.urai.solomon} ${k.urai.kalaignar}`),
    adhikaram: adhikaramNames.get(k.adhikaram) ?? '',
  }));
  return index;
};

/** A hit at the start of a word beats one in the middle of one. */
const scoreIn = (haystack: string, needle: string): number => {
  const at = haystack.indexOf(needle);
  if (at < 0) return 0;
  const atWordStart = at === 0 || haystack[at - 1] === ' ';
  return atWordStart ? 2 : 1;
};

/**
 * @param within optional narrowing, so a search can be run inside one paal,
 * iyal or adhikaram rather than across the whole book.
 */
export const searchKurals = (
  query: string,
  limit = 60,
  within?: (kural: Kural) => boolean,
): readonly SearchHit[] => {
  const needle = normalise(query);
  if (needle.length < 2) return [];

  const hits: SearchHit[] = [];
  for (const row of getIndex()) {
    if (within && !within(row.kural)) continue;
    const inKural = scoreIn(row.text, needle);
    if (inKural) {
      hits.push({ kural: row.kural, score: 100 + inKural, field: 'kural' });
      continue;
    }
    const inAdhikaram = scoreIn(row.adhikaram, needle);
    if (inAdhikaram) {
      hits.push({ kural: row.kural, score: 50 + inAdhikaram, field: 'adhikaram' });
      continue;
    }
    const inUrai = scoreIn(row.urai, needle);
    if (inUrai) hits.push({ kural: row.kural, score: 10 + inUrai, field: 'urai' });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.kural.id - b.kural.id)
    .slice(0, limit);
};

/** "42" or "குறள் 42" is a jump, not a search. */
export const kuralNumberIn = (query: string): number | null => {
  const digits = (query ?? '').trim().match(/^(?:குறள்\s*)?(\d{1,4})$/);
  if (!digits) return null;
  const id = Number(digits[1]);
  return id >= 1 && id <= KURAL_COUNT ? id : null;
};
