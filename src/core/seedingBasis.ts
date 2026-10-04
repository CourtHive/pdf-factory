/**
 * Why a seed exists, annotated for print.
 *
 * `SeedAssignment.seedingBasis` (factory 7.1+) records the ground on which a seeding was awarded,
 * as distinct from `seedValue`, which says only where it sits in the order. The distinction is
 * load-bearing wherever a governing body permits seeds ABOVE the count its `seedsCountThresholds`
 * allow — a protected ranking seeded ALONGSIDE the normal seeds rather than in place of one of
 * them. Such a seed displaced nobody, is usually bounded per season, and is the one an appeal will
 * ask about.
 *
 * **The printed sheet is where that question gets asked**, which is why this exists at all: "why is
 * there a ninth seed" has to be answerable from the artefact, not from the operator's memory.
 *
 * ## Markers, not a column
 *
 * `RANKING` is the ordinary basis and is deliberately left ABSENT on ordinary seeds — the factory's
 * rule is that an absent basis means "the usual one", not "unknown". A Basis column would therefore
 * be empty for every normal seed and read as missing data. A marker puts the weight on the
 * exception, which is what a reader is scanning for, and costs no column width in an already-tight
 * two-column footer.
 *
 * One marker per DISTINCT basis, assigned in order of first appearance. With a single basis — the
 * overwhelming case — that is one dagger and one footnote line. Two bases keep their identities
 * rather than collapsing into a footnote that names both and tells you which seed has which.
 */

/**
 * WinAnsiEncoding code points (0x86, 0x87, 0xA7, 0xB6), so jsPDF's standard Helvetica renders them
 * without an embedded font. The em dash already used by `footerLayouts` is the same class of
 * character, which is the precedent this follows.
 */
const MARKERS = ['†', '‡', '§', '¶'];

const BASIS_LABELS: Record<string, string> = {
  ORGANISER_DISCRETION: 'organiser discretion',
  PROTECTED_RANKING: 'protected ranking',
  RANKING: 'ranking',
  RATING: 'rating',
};

/** The ordinary basis. Never marked: marking every seed would bury the one that is not ordinary. */
const ORDINARY_BASIS = 'RANKING';

export type SeedingBasisAnnotations = {
  /** One entry per input seed, parallel and same length. `''` where the seed is ordinary. */
  markers: string[];
  /** Footnote lines to print below the seed block, in marker order. Empty when nothing is marked. */
  footnotes: string[];
  /** Whether anything was marked — cheaper at call sites than checking both arrays. */
  hasAnnotations: boolean;
};

/**
 * Assign a marker to every seed carrying a non-ordinary basis, and build the footnote lines.
 *
 * Unknown basis values are passed through verbatim rather than dropped. The factory's
 * `SeedingBasisEnum` can gain members, and a sheet that silently omits a basis it does not
 * recognise is worse than one that prints an unfamiliar word — the second is a question, the first
 * is a wrong answer.
 */
export function annotateSeedingBases(seeds: { seedingBasis?: string }[]): SeedingBasisAnnotations {
  const markerByBasis = new Map<string, string>();

  const markers = seeds.map((seed) => {
    const basis = seed?.seedingBasis;
    if (!basis || basis === ORDINARY_BASIS) return '';

    const existing = markerByBasis.get(basis);
    if (existing) return existing;

    // Past the marker pool, further bases share the last marker rather than printing nothing. Four
    // distinct bases on one draw is not a real scenario; a seed with no marker at all would be.
    const marker = MARKERS[markerByBasis.size] ?? MARKERS[MARKERS.length - 1];
    markerByBasis.set(basis, marker);
    return marker;
  });

  const footnotes = [...markerByBasis.entries()].map(
    ([basis, marker]) => `${marker} Additional seed — ${BASIS_LABELS[basis] ?? basis.toLowerCase()}`,
  );

  return { markers, footnotes, hasAnnotations: footnotes.length > 0 };
}
