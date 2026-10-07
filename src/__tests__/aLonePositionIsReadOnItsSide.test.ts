import { sideOrderedDrawPositions } from '../core/sideOrderedDrawPositions';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData } from '../core/drawsDataToDrawData';
import { extractDrawData } from '../core/extractDrawData';
import { describe, it, expect } from 'vitest';

/**
 * A LONE POSITION IS READ ON ITS OWN SIDE, whichever shape the factory stores it in.
 *
 * The renderers read `drawPositions[0]` as side 1 and `[1]` as side 2. The factory is removing the leading hole that
 * held a lone side-2 survivor at index 1 (`[undefined, 4]` becomes `[4]`; Mentat `LEADING_HOLE_REMOVAL_DESIGN.md`,
 * CA 2026-10-06), and stored compacted that survivor would print in the side-1 slot. `DrawMatchUp.drawPositions` is
 * now resolved into side order at both boundaries: `extractDrawData` (raw drawDefinition, through the factory's round
 * profile) and `structureToDrawData` (hydrated `sides`).
 *
 * The draw: SINGLE_ELIMINATION 8 with a double walkover at `1|1`, so `2|1` holds only `1|2`'s winner, on side 2.
 */
const draw = () => {
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [
      {
        drawSize: 8,
        drawType: 'SINGLE_ELIMINATION',
        outcomes: [
          { roundNumber: 1, roundPosition: 1, matchUpStatus: 'DOUBLE_WALKOVER' },
          { roundNumber: 1, roundPosition: 2, winningSide: 2, scoreString: '6-1 6-2' },
        ],
      },
    ],
    setState: true,
  });
  expect(result.success).toEqual(true);
  const drawDefinition: any = (tournamentEngine.getEvents() as any).events?.[0]?.drawDefinitions?.[0];
  const structure = drawDefinition.structures[0];
  const stored = structure.matchUps.find((m: any) => m.roundNumber === 2 && m.roundPosition === 1);
  const lone = stored.drawPositions.filter(Boolean)[0];
  return { drawDefinition, stored, lone };
};

describe('a lone side-2 survivor', () => {
  it.each([
    ['compacted, as the factory will store it', (lone: number) => [lone]],
    ['with the leading hole, as it is stored today', (lone: number) => [undefined, lone]],
  ])('is on side 2 through extractDrawData when stored %s', (_label, shape) => {
    const { drawDefinition, stored, lone } = draw();
    // CONTROL: the matchUp holds one position, the bottom feeder's winner, so it is side 2's
    expect(lone).toBeDefined();
    stored.drawPositions = shape(lone);

    const matchUp = extractDrawData({ drawDefinition }).matchUps.find(
      (candidate) => candidate.roundNumber === 2 && candidate.roundPosition === 1,
    );
    expect(matchUp?.drawPositions).toEqual([undefined, lone]);
  });

  it('is on side 2 through structureToDrawData, read from the hydrated sides', () => {
    const { drawDefinition, lone } = draw();
    const eventData: any = tournamentEngine.getEventData({ drawId: drawDefinition.drawId });
    const structure = eventData.eventData?.drawsData?.[0]?.structures?.[0];
    const matchUp = structureToDrawData(structure).matchUps.find(
      (candidate) => candidate.roundNumber === 2 && candidate.roundPosition === 1,
    );
    expect(matchUp?.drawPositions).toEqual([undefined, lone]);
  });

  it('falls back to the stored array when nothing says the side', () => {
    expect(sideOrderedDrawPositions({ drawPositions: [3, 7] })).toEqual([3, 7]);
    expect(sideOrderedDrawPositions({ drawPositions: [] })).toEqual([]);
  });
});
