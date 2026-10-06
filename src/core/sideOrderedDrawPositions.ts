/**
 * A matchUp's drawPositions in SIDE order, `[side 1, side 2]`, with a hole where a side holds none.
 *
 * The renderers read `drawPositions[0]` as side 1 and `[1]` as side 2. That holds only while the array is stored in
 * side order, and the factory is removing the leading hole that put a lone side-2 survivor at index 1
 * (`[undefined, 5]` becomes `[5]`; Mentat `LEADING_HOLE_REMOVAL_DESIGN.md`, CA 2026-10-06). Stored compacted, a lone
 * side-2 survivor would print in the side-1 slot. So the side order is resolved here, once, at the boundary:
 *
 *  1. hydrated `sides`, each naming its `sideNumber` and `drawPosition` (the `drawsData` path);
 *  2. otherwise the round profile's `pairedDrawPositions` for this matchUp, which the factory derives structurally
 *     (a fed position takes side 1; an advanced one is ordered by the prior-round matchUp it came from);
 *  3. otherwise the array as stored.
 */
export function sideOrderedDrawPositions(matchUp: any, roundProfile?: any): (number | undefined)[] {
  const sides: any[] = matchUp?.sides ?? [];
  const bySide = [1, 2].map(
    (sideNumber) => sides.find((side: any) => side?.sideNumber === sideNumber)?.drawPosition as number | undefined,
  );
  if (bySide.some(Boolean)) return bySide;

  const paired = roundProfile?.[matchUp?.roundNumber]?.pairedDrawPositions?.[(matchUp?.roundPosition ?? 0) - 1];
  if (Array.isArray(paired) && paired.some(Boolean)) return [paired[0] ?? undefined, paired[1] ?? undefined];

  return matchUp?.drawPositions ?? [];
}
