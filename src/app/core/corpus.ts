import kuralJson from '../../data/kural.json';
import structureJson from '../../data/structure.json';

/** A single couplet with its three prose commentaries. */
export interface Kural {
  readonly id: number;
  readonly lines: readonly [string, string];
  readonly urai: { readonly muva: string; readonly solomon: string; readonly kalaignar: string };
  readonly adhikaram: number;
  readonly iyal: number;
  readonly paal: number;
}

/** Chapter: 133 of them, ten kurals each. */
export interface Adhikaram {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly iyal: number;
  readonly paal: number;
  readonly kurals: readonly number[];
}

/** Chapter group: 13 of them. */
export interface Iyal {
  readonly id: number;
  readonly name: string;
  readonly paal: number;
  readonly adhikarams: readonly number[];
}

/** Book: அறம், பொருள், இன்பம். */
export interface Paal {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly iyals: readonly number[];
}

export const KURALS = kuralJson as readonly unknown[] as readonly Kural[];
export const ADHIKARAMS = structureJson.adhikaram as readonly Adhikaram[];
export const IYALS = structureJson.iyal as readonly Iyal[];
export const PAALS = structureJson.paal as readonly Paal[];

export const KURAL_COUNT = KURALS.length;

const byId = <T extends { id: number }>(rows: readonly T[]) =>
  new Map(rows.map((row) => [row.id, row]));

const kuralById = byId(KURALS);
const adhikaramById = byId(ADHIKARAMS);
const iyalById = byId(IYALS);
const paalById = byId(PAALS);

export const kural = (id: number): Kural | undefined => kuralById.get(id);
export const adhikaram = (id: number): Adhikaram | undefined => adhikaramById.get(id);
export const iyal = (id: number): Iyal | undefined => iyalById.get(id);
export const paal = (id: number): Paal | undefined => paalById.get(id);

export const kuralsOfAdhikaram = (id: number): readonly Kural[] =>
  (adhikaram(id)?.kurals ?? []).map((k) => kuralById.get(k)!).filter(Boolean);

export const adhikaramsOfIyal = (id: number): readonly Adhikaram[] =>
  (iyal(id)?.adhikarams ?? []).map((a) => adhikaramById.get(a)!).filter(Boolean);

export const iyalsOfPaal = (id: number): readonly Iyal[] =>
  (paal(id)?.iyals ?? []).map((i) => iyalById.get(i)!).filter(Boolean);

export const adhikaramsOfPaal = (id: number): readonly Adhikaram[] =>
  ADHIKARAMS.filter((a) => a.paal === id);

/** Breadcrumb trail for a kural: பால் › இயல் › அதிகாரம். */
export interface KuralContext {
  readonly kural: Kural;
  readonly adhikaram: Adhikaram;
  readonly iyal: Iyal;
  readonly paal: Paal;
}

export const contextOf = (k: Kural): KuralContext => ({
  kural: k,
  adhikaram: adhikaram(k.adhikaram)!,
  iyal: iyal(k.iyal)!,
  paal: paal(k.paal)!,
});

/**
 * The kural of the day. Derived from the date alone so that every visitor sees
 * the same couplet and it can be computed with no network and no server.
 */
export const kuralOfTheDay = (date = new Date()): Kural => {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  // A stride coprime with 1330 walks the whole book before repeating.
  return KURALS[(dayNumber * 421) % KURAL_COUNT];
};

export const isKuralId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= KURAL_COUNT;
