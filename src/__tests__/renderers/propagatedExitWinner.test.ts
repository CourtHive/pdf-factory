import { resolveWinnerDrawPosition } from '../../core/winnerDrawPosition';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData } from '../../core/drawsDataToDrawData';
import { extractDrawData } from '../../core/extractDrawData';
import { describe, it, expect } from 'vitest';

/**
 * A matchUp decided by a PROPAGATED EXIT carries a `winningSide` before its second participant has
 * arrived, and its `drawPositions` is COMPACTED to the one position present. `[4]` with
 * `winningSide: 2` then indexes past the end of the array.
 *
 * The advancing participant rendered as a BLANK LINE on the draw sheet. It did not throw, and a
 * fully-played draw cannot express the state at all — which is why it survived: every existing
 * renderer fixture either completes the draw or leaves it undecided.
 *
 * Measured 2026-09-18 over 9 draw types x 3 sizes x 6 double-exit placements: of 1,488 decided
 * matchUps, 162 held a single drawPosition, and 81 of those — every one whose winner sat on side 2
 * — resolved to `undefined` by index. Exactly half, because side 1 coincides with index 0.
 */
describe('a matchUp decided by a propagated exit', () => {
  /** Two double exits in round 1 produce a WALKOVER and a DEFAULTED in round 2, each awaiting an opponent. */
  const drawWithPropagatedExits = () => {
    const result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [
        {
          drawSize: 8,
          drawType: 'SINGLE_ELIMINATION',
          outcomes: [
            { roundNumber: 1, roundPosition: 1, matchUpStatus: 'DOUBLE_WALKOVER' },
            { roundNumber: 1, roundPosition: 2, winningSide: 2, scoreString: '6-1 6-2' },
            { roundNumber: 1, roundPosition: 3, matchUpStatus: 'DOUBLE_DEFAULT' },
            { roundNumber: 1, roundPosition: 4, winningSide: 1, scoreString: '6-1 6-2' },
          ],
        },
      ],
      setState: true,
    });
    expect(result.success).toEqual(true);
    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const eventData: any = tournamentEngine.getEventData({ drawId: drawDefinition.drawId });
    const structures = eventData.eventData?.drawsData?.[0]?.structures ?? [];
    const structure = structures.find((candidate: any) => candidate.stage === 'MAIN') ?? structures[0];
    expect(structure).toBeDefined();
    return { drawDefinition, structure };
  };

  it('resolves the winner through the hydrated pipeline, where the index yields nothing', () => {
    const { structure } = drawWithPropagatedExits();
    const drawData = structureToDrawData(structure);

    const pending = drawData.matchUps.filter(
      (matchUp) => matchUp.winningSide && matchUp.drawPositions.filter(Boolean).length === 1,
    );
    // The control: if this is empty the fixture stopped reproducing and the rest proves nothing.
    expect(pending.length).toBeGreaterThan(0);

    const sideTwoWinners = pending.filter((matchUp) => matchUp.winningSide === 2);
    expect(sideTwoWinners.length).toBeGreaterThan(0);

    for (const matchUp of sideTwoWinners) {
      // What the renderers used to do — this is the defect, asserted so a regression is visible.
      expect(matchUp.drawPositions[(matchUp.winningSide as number) - 1]).toBeUndefined();

      // What they do now.
      expect(matchUp.winnerDrawPosition).toBeDefined();
      const slot = drawData.slots.find((candidate) => candidate.drawPosition === matchUp.winnerDrawPosition);
      expect(slot?.participantName).toBeTruthy();
    }
  });

  it('resolves the winner on the raw drawDefinition path, which carries no sides', () => {
    const { drawDefinition } = drawWithPropagatedExits();
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });
    const drawData = extractDrawData({ drawDefinition, participants: participants.participants ?? [] });

    const pending = drawData.matchUps.filter(
      (matchUp) => matchUp.winningSide && matchUp.drawPositions.filter(Boolean).length === 1,
    );
    expect(pending.length).toBeGreaterThan(0);

    for (const matchUp of pending) {
      expect(matchUp.winnerDrawPosition).toEqual(matchUp.drawPositions.filter(Boolean)[0]);
    }
  });

  it('leaves a fully-decided matchUp exactly where the index put it', () => {
    const { structure } = drawWithPropagatedExits();
    const drawData = structureToDrawData(structure);

    const decided = drawData.matchUps.filter(
      (matchUp) => matchUp.winningSide && matchUp.drawPositions.filter(Boolean).length === 2,
    );
    expect(decided.length).toBeGreaterThan(0);

    for (const matchUp of decided) {
      expect(matchUp.winnerDrawPosition).toEqual(matchUp.drawPositions[(matchUp.winningSide as number) - 1]);
    }
  });

  it('declines to invent a winner where there is none', () => {
    expect(resolveWinnerDrawPosition({ drawPositions: [3, 4] })).toBeUndefined();
    expect(resolveWinnerDrawPosition(undefined)).toBeUndefined();
    expect(resolveWinnerDrawPosition({ winningSide: 2, drawPositions: [] })).toBeUndefined();
  });
});
