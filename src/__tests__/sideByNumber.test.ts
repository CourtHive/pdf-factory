import { sideByNumber } from '../core/sideByNumber';
import { describe, it, expect } from 'vitest';

/**
 * Array position is not `sideNumber`. The schedule and court-card extractors read `sides[0]` and
 * `sides[1]` directly, which is right only while the array happens to be in side order — the last
 * residue of `DRAWPOSITIONS_CONSUMER_REMEDIATION_PLAN.md` stage 1d.
 */
describe('sideByNumber', () => {
  it('resolves by sideNumber even when the array is out of order', () => {
    // the case the index read gets wrong, and the reason this exists
    const sides = [
      { sideNumber: 2, participant: { participantName: 'Second' } },
      { sideNumber: 1, participant: { participantName: 'First' } },
    ];
    expect(sideByNumber(sides, 1).participant.participantName).toEqual('First');
    expect(sideByNumber(sides, 2).participant.participantName).toEqual('Second');
  });

  it('falls back to order when no side names itself', () => {
    // the public API admits sparser input than competitionScheduleMatchUps returns; these are
    // display paths, so order is an acceptable last resort
    const sides = [{ participant: { participantName: 'A' } }, { participant: { participantName: 'B' } }];
    expect(sideByNumber(sides, 1).participant.participantName).toEqual('A');
    expect(sideByNumber(sides, 2).participant.participantName).toEqual('B');
  });

  it('returns undefined rather than inventing a side', () => {
    expect(sideByNumber([], 1)).toBeUndefined();
    expect(sideByNumber([{ sideNumber: 1 }], 2)).toBeUndefined();
  });
});
