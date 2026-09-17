import { describe, it, expect } from 'vitest';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../../core/extractDrawData';
import { splitDraw } from '../../renderers/drawSplitter';
import { positionlessPartitionIndex } from '../../renderers/positionlessPlacement';

/**
 * A matchUp holding no drawPosition must land in exactly one partition, or none — never in all.
 *
 * `Array.prototype.every` returns `true` for an empty array, so such a matchUp satisfied every
 * positional predicate it was offered: both halves of `mirroredDraw`, and every page segment of
 * `drawSplitter`. It does not throw; the symptom is a duplicated or misplaced empty bracket, which
 * is why it survived.
 *
 * ## Two things these tests have to work around
 *
 * `DrawMatchUp` carries NO `matchUpId`, so a matchUp cannot be tracked by identity across a split —
 * an identity check compares `undefined === undefined` and reports every matchUp as duplicated. And
 * `renumberRoundPositions` rewrites `roundPosition` inside each segment, so that is no identity
 * either. These assert on COUNTS per round instead, which is duplication-sensitive without needing
 * identity: duplication inflates the total, dropping deflates it.
 *
 * ## The draw must be UNPLAYED or PARTLY played
 *
 * `completeAllMatchUps: true` fills every `drawPositions` array and makes the case unrepresentable —
 * which is why the existing `drawSplitter` suite, whose `makeDrawData` completes every matchUp,
 * never caught this.
 */
describe('a matchUp holding no drawPosition', () => {
  const drawData = (drawSize: number, completionGoal?: number) => {
    const result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize, eventName: 'Singles', ...(completionGoal ? { completionGoal } : {}) }],
      setState: true,
    });
    expect(result.success).toEqual(true);
    const events: any = tournamentEngine.getEvents();
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });
    return extractDrawData({
      drawDefinition: events.events?.[0]?.drawDefinitions?.[0],
      participants: participants.participants || [],
    });
  };

  const positionless = (matchUps: any[]) => matchUps.filter((mu: any) => !(mu.drawPositions ?? []).length);

  const countByRound = (matchUps: any[]) =>
    positionless(matchUps).reduce((acc: Record<number, number>, mu: any) => {
      acc[mu.roundNumber] = (acc[mu.roundNumber] ?? 0) + 1;
      return acc;
    }, {});

  it.each([
    { label: 'unplayed', completionGoal: undefined },
    { label: 'partly played', completionGoal: 20 },
  ])('is never drawn twice across page segments — $label', ({ completionGoal }) => {
    const data = drawData(64, completionGoal);

    // CONTROL: the defect needs position-less matchUps to exist. A completed draw has none and this
    // would pass while proving nothing.
    expect(positionless(data.matchUps).length).toBeGreaterThan(0);

    const segments = splitDraw(data, { maxPositionsPerPage: 32, includeOverlapRounds: true, summaryPage: false });
    expect(segments.length).toBeGreaterThan(1); // CONTROL: one segment cannot show duplication

    const segmentRounds = Math.log2(32);
    const expected = countByRound(data.matchUps);
    const actual = segments.reduce((acc: Record<number, number>, segment: any) => {
      for (const [round, count] of Object.entries(countByRound(segment.matchUps))) {
        acc[Number(round)] = (acc[Number(round)] ?? 0) + (count as number);
      }
      return acc;
    }, {});

    const offenders: string[] = [];
    for (const [round, count] of Object.entries(expected)) {
      if (Number(round) > segmentRounds) continue; // excluded from position segments by design
      const seen = actual[Number(round)] ?? 0;
      if (seen !== count) offenders.push(`round ${round}: expected ${count} across all segments, saw ${seen}`);
    }
    expect(offenders).toEqual([]);
  });

  it('is placed by roundPosition, and a round that spans partitions belongs to none', () => {
    const matchUps: any[] = [
      ...Array.from({ length: 8 }, (_, index) => ({ roundNumber: 1, roundPosition: index + 1, drawPositions: [] })),
      ...Array.from({ length: 2 }, (_, index) => ({ roundNumber: 3, roundPosition: index + 1, drawPositions: [] })),
      { roundNumber: 4, roundPosition: 1, drawPositions: [] },
    ];

    // Round 1, eight matchUps over two partitions: the first four are the top half.
    const firstHalf = [1, 2, 3, 4].map((roundPosition) =>
      positionlessPartitionIndex({
        matchUps,
        matchUp: { roundNumber: 1, roundPosition, drawPositions: [] } as any,
        partitionCount: 2,
      }),
    );
    const secondHalf = [5, 6, 7, 8].map((roundPosition) =>
      positionlessPartitionIndex({
        matchUps,
        matchUp: { roundNumber: 1, roundPosition, drawPositions: [] } as any,
        partitionCount: 2,
      }),
    );
    expect(firstHalf).toEqual([0, 0, 0, 0]);
    expect(secondHalf).toEqual([1, 1, 1, 1]);

    // A round holding fewer matchUps than there are partitions spans them, so no partition owns it.
    // A PLAYED final has drawPositions on both sides of the split and is already excluded by the
    // positional predicate; excluding the unplayed one keeps the two consistent.
    expect(
      positionlessPartitionIndex({
        matchUps,
        matchUp: { roundNumber: 4, roundPosition: 1, drawPositions: [] } as any,
        partitionCount: 2,
      }),
    ).toBeUndefined();

    // Four partitions over a two-matchUp round: also spans.
    expect(
      positionlessPartitionIndex({
        matchUps,
        matchUp: { roundNumber: 3, roundPosition: 1, drawPositions: [] } as any,
        partitionCount: 4,
      }),
    ).toBeUndefined();
  });
});
