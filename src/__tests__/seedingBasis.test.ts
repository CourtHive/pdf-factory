import { describe, it, expect } from 'vitest';
import { annotateSeedingBases } from '../core/seedingBasis';

const DAGGER = '†';
const DOUBLE_DAGGER = '‡';

describe('annotateSeedingBases', () => {
  it('marks nothing when every seed is ordinary', () => {
    const result = annotateSeedingBases([{}, {}, {}]);
    expect(result.markers).toEqual(['', '', '']);
    expect(result.footnotes).toEqual([]);
    expect(result.hasAnnotations).toBe(false);
  });

  it('treats an explicit RANKING as ordinary', () => {
    // The factory's rule is that an ABSENT basis means RANKING. A record that states it explicitly
    // means the same thing, and marking it would bury the seed that is genuinely unusual.
    const result = annotateSeedingBases([{ seedingBasis: 'RANKING' }, {}]);
    expect(result.hasAnnotations).toBe(false);
  });

  it('marks one basis with one marker and one footnote', () => {
    const result = annotateSeedingBases([{}, {}, { seedingBasis: 'PROTECTED_RANKING' }]);
    expect(result.markers).toEqual(['', '', DAGGER]);
    expect(result.footnotes).toEqual([`${DAGGER} Additional seed — protected ranking`]);
    expect(result.hasAnnotations).toBe(true);
  });

  it('gives seeds sharing a basis the SAME marker', () => {
    const result = annotateSeedingBases([
      {},
      { seedingBasis: 'PROTECTED_RANKING' },
      { seedingBasis: 'PROTECTED_RANKING' },
    ]);
    expect(result.markers).toEqual(['', DAGGER, DAGGER]);
    expect(result.footnotes).toHaveLength(1);
  });

  it('keeps two bases distinct rather than collapsing them', () => {
    // A footnote naming both bases would leave the reader unable to tell which seed has which,
    // which is the one question the marker exists to answer.
    const result = annotateSeedingBases([
      { seedingBasis: 'PROTECTED_RANKING' },
      {},
      { seedingBasis: 'ORGANISER_DISCRETION' },
    ]);
    expect(result.markers).toEqual([DAGGER, '', DOUBLE_DAGGER]);
    expect(result.footnotes).toEqual([
      `${DAGGER} Additional seed — protected ranking`,
      `${DOUBLE_DAGGER} Additional seed — organiser discretion`,
    ]);
  });

  it('assigns markers in order of FIRST APPEARANCE, not alphabetically', () => {
    const result = annotateSeedingBases([{ seedingBasis: 'RATING' }, { seedingBasis: 'PROTECTED_RANKING' }]);
    expect(result.markers).toEqual([DAGGER, DOUBLE_DAGGER]);
  });

  it('prints an unrecognised basis rather than dropping it', () => {
    // SeedingBasisEnum can gain members. A sheet that silently omits a basis it does not know is
    // worse than one printing an unfamiliar word: the second is a question, the first a wrong answer.
    const result = annotateSeedingBases([{ seedingBasis: 'SOME_NEW_BASIS' }]);
    expect(result.markers).toEqual([DAGGER]);
    expect(result.footnotes).toEqual([`${DAGGER} Additional seed — some_new_basis`]);
  });

  it('still marks a seed once the marker pool is exhausted', () => {
    // Five distinct bases on one draw is not a real scenario; an unmarked seed would be.
    const result = annotateSeedingBases([
      { seedingBasis: 'B1' },
      { seedingBasis: 'B2' },
      { seedingBasis: 'B3' },
      { seedingBasis: 'B4' },
      { seedingBasis: 'B5' },
    ]);
    expect(result.markers.every((marker) => marker !== '')).toBe(true);
    expect(result.markers).toHaveLength(5);
  });

  it('returns markers parallel to the input, so a call site can index by position', () => {
    const seeds = [{}, { seedingBasis: 'PROTECTED_RANKING' }, {}, {}];
    expect(annotateSeedingBases(seeds).markers).toHaveLength(seeds.length);
  });
});
