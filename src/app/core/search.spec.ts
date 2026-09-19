import { kuralNumberIn, normalise, searchKurals } from './search';

describe('normalise', () => {
  it('strips punctuation and collapses whitespace', () => {
    expect(normalise('  அன்பு,   நட்பு!  ')).toBe('அன்பு நட்பு');
  });

  it('tolerates an empty value', () => {
    expect(normalise('')).toBe('');
  });
});

describe('searchKurals', () => {
  it('ignores queries too short to be useful', () => {
    expect(searchKurals('அ').length).toBe(0);
  });

  it('finds a word that appears in the couplet itself', () => {
    const hits = searchKurals('மழை');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].field).toBe('kural');
  });

  it('ranks couplet matches above commentary matches', () => {
    const hits = searchKurals('கல்வி');
    const firstUrai = hits.findIndex((hit) => hit.field === 'urai');
    const lastKural = hits.map((hit) => hit.field).lastIndexOf('kural');
    if (firstUrai >= 0 && lastKural >= 0) expect(lastKural).toBeLessThan(firstUrai);
  });

  it('matches text that only appears in a commentary', () => {
    const hits = searchKurals('கடவுளை');
    expect(hits.some((hit) => hit.field === 'urai')).toBe(true);
  });

  it('respects the result limit', () => {
    expect(searchKurals('ம', 10).length).toBeLessThanOrEqual(10);
  });
});

describe('kuralNumberIn', () => {
  it('reads a bare number', () => {
    expect(kuralNumberIn('42')).toBe(42);
  });

  it('reads a number with the word குறள்', () => {
    expect(kuralNumberIn('குறள் 1330')).toBe(1330);
  });

  it('rejects numbers outside the book', () => {
    expect(kuralNumberIn('1331')).toBeNull();
    expect(kuralNumberIn('0')).toBeNull();
  });

  it('rejects ordinary words', () => {
    expect(kuralNumberIn('அன்பு')).toBeNull();
  });
});
