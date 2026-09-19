import {
  ADHIKARAMS,
  IYALS,
  KURALS,
  KURAL_COUNT,
  PAALS,
  adhikaramsOfIyal,
  contextOf,
  kural,
  kuralOfTheDay,
  kuralsOfAdhikaram,
} from './corpus';

describe('corpus', () => {
  it('holds the whole book', () => {
    expect(KURALS.length).toBe(1330);
    expect(ADHIKARAMS.length).toBe(133);
    expect(IYALS.length).toBe(13);
    expect(PAALS.length).toBe(3);
  });

  it('numbers kurals contiguously from 1', () => {
    KURALS.forEach((k, index) => expect(k.id).toBe(index + 1));
  });

  it('gives every kural two lines and three commentaries', () => {
    for (const k of KURALS) {
      expect(k.lines.length).toBe(2);
      expect(k.lines[0].length).toBeGreaterThan(0);
      expect(k.lines[1].length).toBeGreaterThan(0);
      expect(k.urai.muva.length).toBeGreaterThan(0);
      expect(k.urai.solomon.length).toBeGreaterThan(0);
      expect(k.urai.kalaignar.length).toBeGreaterThan(0);
    }
  });

  it('puts ten kurals in every adhikaram', () => {
    for (const a of ADHIKARAMS) {
      expect(kuralsOfAdhikaram(a.id).length).toBe(10);
    }
  });

  it('resolves the full context of a kural', () => {
    const context = contextOf(kural(1)!);
    expect(context.adhikaram.name).toBe('கடவுள் வாழ்த்து');
    expect(context.paal.id).toBe(1);
  });

  it('accounts for every adhikaram exactly once across the iyals', () => {
    const seen = IYALS.flatMap((i) => adhikaramsOfIyal(i.id).map((a) => a.id));
    expect(new Set(seen).size).toBe(ADHIKARAMS.length);
    expect(seen.length).toBe(ADHIKARAMS.length);
  });

  describe('kural of the day', () => {
    it('gives the same kural for the same date', () => {
      const morning = new Date(2026, 2, 4, 8, 0, 0);
      const evening = new Date(2026, 2, 4, 21, 30, 0);
      expect(kuralOfTheDay(morning).id).toBe(kuralOfTheDay(evening).id);
    });

    it('changes from one day to the next', () => {
      const first = kuralOfTheDay(new Date(2026, 2, 4, 8, 0, 0));
      const second = kuralOfTheDay(new Date(2026, 2, 5, 8, 0, 0));
      expect(first.id).not.toBe(second.id);
    });

    it('covers the whole book before repeating', () => {
      const seen = new Set<number>();
      const start = new Date(2026, 0, 1, 12, 0, 0);
      for (let day = 0; day < KURAL_COUNT; day++) {
        const date = new Date(start);
        date.setDate(start.getDate() + day);
        seen.add(kuralOfTheDay(date).id);
      }
      expect(seen.size).toBe(KURAL_COUNT);
    });
  });
});
