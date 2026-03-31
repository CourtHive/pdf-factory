import type { DrawSplitConfig } from '../config/types';
import type { DrawData, DrawSlot, DrawMatchUp } from '../core/extractDrawData';

export interface DrawSegment {
  label: string;
  startPosition: number;
  endPosition: number;
  slots: DrawSlot[];
  matchUps: DrawMatchUp[];
  segmentRounds: number;
  /** If true, this segment should NOT render a winner column */
  noWinnerColumn?: boolean;
  /** Remapped round labels for this segment */
  roundLabelMap?: Record<number, string>;
}

const DEFAULT_SPLIT: DrawSplitConfig = {
  maxPositionsPerPage: 64,
  includeOverlapRounds: true,
  summaryPage: true,
};

export function splitDraw(drawData: DrawData, config: DrawSplitConfig = DEFAULT_SPLIT): DrawSegment[] {
  const { drawSize, slots, matchUps, totalRounds, roundLabelMap } = drawData;

  if (drawSize <= config.maxPositionsPerPage) {
    return [
      {
        label: 'Full Draw',
        startPosition: 1,
        endPosition: drawSize,
        slots,
        matchUps,
        segmentRounds: totalRounds,
      },
    ];
  }

  const segmentSize = config.maxPositionsPerPage;
  const segmentCount = Math.ceil(drawSize / segmentSize);
  // Rounds contained entirely within each segment (no cross-segment matches)
  const segmentRounds = Math.log2(segmentSize);
  const segments: DrawSegment[] = [];

  for (let i = 0; i < segmentCount; i++) {
    const startPos = i * segmentSize + 1;
    const endPos = Math.min((i + 1) * segmentSize, drawSize);
    let segmentLabel = `Section ${i + 1}`;
    if (segmentCount === 2) segmentLabel = i === 0 ? 'Top Half' : 'Bottom Half';

    const segSlots = slots.filter((s) => s.drawPosition >= startPos && s.drawPosition <= endPos);

    // Include matchUps whose ALL draw positions fall within this segment,
    // and renumber roundPosition to be relative to this segment
    const segMatchUpsRaw = matchUps.filter((mu) => {
      if (mu.roundNumber > segmentRounds) return false;
      return mu.drawPositions.every((dp) => dp >= startPos && dp <= endPos);
    });

    // Group by round and renumber roundPosition starting from 1
    const byRound = new Map<number, DrawMatchUp[]>();
    for (const mu of segMatchUpsRaw) {
      if (!byRound.has(mu.roundNumber)) byRound.set(mu.roundNumber, []);
      byRound.get(mu.roundNumber)!.push(mu);
    }
    const segMatchUps: DrawMatchUp[] = [];
    for (const [, roundMus] of byRound) {
      roundMus.sort((a, b) => a.roundPosition - b.roundPosition);
      roundMus.forEach((mu, idx) => {
        segMatchUps.push({ ...mu, roundPosition: idx + 1 });
      });
    }

    segments.push({
      label: segmentLabel,
      startPosition: startPos,
      endPosition: endPos,
      slots: segSlots,
      matchUps: segMatchUps,
      segmentRounds,
      noWinnerColumn: true,
    });
  }

  // Final rounds page: last 5 rounds (or fewer if the draw doesn't have that many)
  if (config.summaryPage && segmentCount > 1) {
    const finalRoundsCount = 5;
    const summaryRoundStart = Math.max(1, totalRounds - finalRoundsCount + 1);
    const summaryMatchUps = matchUps.filter((mu) => mu.roundNumber >= summaryRoundStart);
    const summaryRounds = totalRounds - summaryRoundStart + 1;

    // Build the final rounds as a self-contained mini-bracket from the original data.
    // The first summary round's matchUps define the draw positions for this bracket.
    const roundOffset = summaryRoundStart - 1;
    const firstRoundMatchUps = matchUps
      .filter((mu) => mu.roundNumber === summaryRoundStart)
      .sort((a, b) => a.roundPosition - b.roundPosition);
    const firstRoundCount = firstRoundMatchUps.length;
    const summaryDrawSize = firstRoundCount * 2;

    // Map original draw positions to sequential 1..N for the mini-bracket
    const positionMap = new Map<number, number>();
    let newPos = 1;
    for (const mu of firstRoundMatchUps) {
      for (const dp of mu.drawPositions) {
        if (dp && !positionMap.has(dp)) {
          positionMap.set(dp, newPos++);
        }
      }
    }

    // Remap all summary matchUps: renumber rounds and draw positions
    const renumbered: DrawMatchUp[] = summaryMatchUps.map((mu) => ({
      ...mu,
      roundNumber: mu.roundNumber - roundOffset,
      roundPosition:
        mu.roundNumber === summaryRoundStart
          ? firstRoundMatchUps.findIndex((m) => m.roundPosition === mu.roundPosition) + 1
          : mu.roundPosition,
      drawPositions: mu.drawPositions.map((dp) => positionMap.get(dp) || dp),
    }));

    // Renumber round positions for rounds after the first
    const byRound = new Map<number, DrawMatchUp[]>();
    for (const mu of renumbered) {
      if (!byRound.has(mu.roundNumber)) byRound.set(mu.roundNumber, []);
      byRound.get(mu.roundNumber)!.push(mu);
    }
    const finalMatchUps: DrawMatchUp[] = [];
    for (const [, roundMus] of byRound) {
      roundMus.sort((a, b) => a.roundPosition - b.roundPosition);
      roundMus.forEach((mu, idx) => {
        finalMatchUps.push({ ...mu, roundPosition: idx + 1 });
      });
    }

    // Remap slots to sequential positions
    const summarySlots: DrawSlot[] = [];
    for (const [origPos, newP] of positionMap) {
      const slot = slots.find((s) => s.drawPosition === origPos);
      if (slot) {
        summarySlots.push({ ...slot, drawPosition: newP });
      }
    }
    summarySlots.sort((a, b) => a.drawPosition - b.drawPosition);

    // Remap roundLabelMap to the renumbered rounds
    const remappedLabels: Record<number, string> | undefined = roundLabelMap
      ? Object.fromEntries(
          Object.entries(roundLabelMap)
            .filter(([rn]) => Number(rn) >= summaryRoundStart)
            .map(([rn, label]) => [Number(rn) - roundOffset, label]),
        )
      : undefined;

    segments.push({
      label: 'Final Rounds',
      startPosition: 1,
      endPosition: summaryDrawSize,
      slots: summarySlots,
      matchUps: finalMatchUps,
      segmentRounds: summaryRounds,
      roundLabelMap: remappedLabels,
    });
  }

  return segments;
}
