import type { DrawMatchUp } from '../core/extractDrawData';

/**
 * Which partition a matchUp belongs to when it holds no drawPosition.
 *
 * `Array.prototype.every` returns `true` for an empty array, so a matchUp whose `drawPositions` is
 * `[]` satisfies EVERY positional predicate it is offered. In `mirroredDraw` that put it in both
 * halves; in `drawSplitter` it put it in every page segment. Neither is a throw — the symptom is a
 * duplicated or misplaced empty bracket, which is why it went unnoticed.
 *
 * `[]` is not an edge case. `extractDrawData`, `drawsDataToDrawData` and `extractCompassData` all
 * normalise an absent `drawPositions` to `[]`, and an absent array is the ordinary stored shape of
 * any matchUp nobody has reached yet. Measured on freshly generated 16 draws with every position
 * filled: SINGLE_ELIMINATION 7 of 15, DOUBLE_ELIMINATION 11 of 31, FEED_IN_CHAMPIONSHIP_TO_SF 10 of
 * 28, COMPASS 12 of 32. On an unplayed or partly played draw — which is exactly when a draw sheet
 * is printed — roughly a third of the matchUps take every branch.
 *
 * ## Where such a matchUp belongs
 *
 * It cannot be placed by position, so it is placed by ROUND POSITION. In an elimination round the
 * first half of the roundPositions feed from the first half of the draw: in a 16 draw, round 1
 * roundPositions 1-4 hold positions 1-8 and 5-8 hold 9-16; round 2 roundPositions 1-2 hold 1-8.
 * That relationship is what the layout already draws.
 *
 * ## When it belongs to NO partition
 *
 * A round holding fewer matchUps than there are partitions spans them — the final of a 16 draw
 * covers both halves — and such a matchUp is placed in none. That is not a new rule: a PLAYED final
 * has drawPositions on both sides of the split and is already excluded by the existing predicates,
 * so excluding the unplayed one keeps the two consistent. Returning `undefined` rather than a
 * partition is what says so.
 */
export function positionlessPartitionIndex({
  partitionCount,
  matchUps,
  matchUp,
}: {
  matchUps: DrawMatchUp[];
  matchUp: DrawMatchUp;
  partitionCount: number;
}): number | undefined {
  if (partitionCount < 1) return undefined;
  const roundMatchUpCount = matchUps.filter((candidate) => candidate.roundNumber === matchUp.roundNumber).length;
  // Fewer matchUps than partitions means this round spans them; no single partition owns it.
  if (roundMatchUpCount < partitionCount) return undefined;

  const perPartition = roundMatchUpCount / partitionCount;
  const roundPosition = matchUp.roundPosition ?? 1;
  const index = Math.floor((roundPosition - 1) / perPartition);
  // A roundPosition beyond the round's own count would index past the last partition.
  return Math.min(index, partitionCount - 1);
}

/**
 * Does `matchUp` belong in the partition at `partitionIndex`?
 *
 * Positional matchUps keep the caller's own predicate — this changes nothing for them. Only the
 * position-less ones are routed by roundPosition.
 */
export function belongsInPartition({
  positionPredicate,
  partitionIndex,
  partitionCount,
  matchUps,
  matchUp,
}: {
  positionPredicate: (drawPosition: number) => boolean;
  matchUps: DrawMatchUp[];
  matchUp: DrawMatchUp;
  partitionIndex: number;
  partitionCount: number;
}): boolean {
  const drawPositions = matchUp.drawPositions ?? [];
  if (drawPositions.length) return drawPositions.every(positionPredicate);
  return positionlessPartitionIndex({ matchUps, matchUp, partitionCount }) === partitionIndex;
}
