/**
 * The drawPosition of a decided matchUp's winner.
 *
 * `drawPositions[winningSide - 1]` is the idiom this replaces, and it is correct ONLY while the
 * array holds both positions. A matchUp decided by a PROPAGATED EXIT — a WALKOVER or DEFAULTED
 * produced upstream by a double exit — carries a `winningSide` before its second participant has
 * arrived, and its `drawPositions` is COMPACTED to the one position present. `[4]` with
 * `winningSide: 2` then indexes past the end and yields `undefined`, so the advancing participant
 * renders as a blank line on the draw sheet.
 *
 * Measured 2026-09-18 over 9 draw types x 3 sizes x 6 double-exit placements: of 1,488 decided
 * matchUps, 162 held a single drawPosition, and 81 of those — every one whose winner sat on side
 * 2 — resolved to `undefined` by index. Reproduced end to end through `structureToDrawData` in
 * `__tests__/renderers/propagatedExitWinner.test.ts`.
 *
 * `sides` is authoritative because the factory builds it from the ORDERED positions, preserving the
 * empty slot (`[[1, undefined], [2, 4]]`) that `drawPositions` discards — see
 * `addMatchUpContext.ts` in `tods-competition-factory`, which maps ordered positions with
 * `sideNumber = index + 1`.
 *
 * When `sides` is absent — `extractDrawData` reads a raw `drawDefinition`, which carries none — a
 * single remaining position is taken to be the winner's. In the same sweep the engine awarded to
 * the side that is PRESENT in 162 of 162 cases; it does not decide in favour of an empty slot.
 */
export function resolveWinnerDrawPosition(matchUp: any): number | undefined {
  if (!matchUp?.winningSide) return undefined;

  const bySide = matchUp.sides?.find((side: any) => side?.sideNumber === matchUp.winningSide)?.drawPosition;
  if (bySide) return bySide;

  const present = (matchUp.drawPositions ?? []).filter(Boolean);
  if (present.length === 1) return present[0];

  return matchUp.drawPositions?.[matchUp.winningSide - 1];
}
