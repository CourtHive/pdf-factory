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
  const { drawSize, slots, matchUps, totalRounds } = drawData;

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
  const segmentRounds = Math.log2(segmentSize);
  const segments: DrawSegment[] = [];

  for (let i = 0; i < segmentCount; i++) {
    segments.push(buildPositionSegment(i, segmentSize, segmentCount, segmentRounds, drawSize, slots, matchUps));
  }

  if (config.summaryPage && segmentCount > 1) {
    segments.push(buildSummarySegment(drawData));
  }

  return segments;
}

function buildPositionSegment(
  index: number,
  segmentSize: number,
  segmentCount: number,
  segmentRounds: number,
  drawSize: number,
  slots: DrawSlot[],
  matchUps: DrawMatchUp[],
): DrawSegment {
  const startPos = index * segmentSize + 1;
  const endPos = Math.min((index + 1) * segmentSize, drawSize);
  let segmentLabel = `Section ${index + 1}`;
  if (segmentCount === 2) segmentLabel = index === 0 ? 'Top Half' : 'Bottom Half';

  const segSlots = slots.filter((s) => s.drawPosition >= startPos && s.drawPosition <= endPos);

  const segMatchUpsRaw = matchUps.filter((mu) => {
    if (mu.roundNumber > segmentRounds) return false;
    return mu.drawPositions.every((dp) => dp >= startPos && dp <= endPos);
  });

  const segMatchUps = renumberRoundPositions(segMatchUpsRaw);

  return {
    label: segmentLabel,
    startPosition: startPos,
    endPosition: endPos,
    slots: segSlots,
    matchUps: segMatchUps,
    segmentRounds,
    noWinnerColumn: true,
  };
}

function buildSummarySegment(drawData: DrawData): DrawSegment {
  const { slots, matchUps, totalRounds, roundLabelMap } = drawData;
  const finalRoundsCount = 5;
  const summaryRoundStart = Math.max(1, totalRounds - finalRoundsCount + 1);
  const summaryRounds = totalRounds - summaryRoundStart + 1;
  const roundOffset = summaryRoundStart - 1;

  const firstRoundMatchUps = matchUps
    .filter((mu) => mu.roundNumber === summaryRoundStart)
    .sort((a, b) => a.roundPosition - b.roundPosition);
  const summaryDrawSize = firstRoundMatchUps.length * 2;

  const positionMap = buildPositionMap(firstRoundMatchUps);

  const summaryMatchUps = matchUps.filter((mu) => mu.roundNumber >= summaryRoundStart);
  const renumbered: DrawMatchUp[] = summaryMatchUps.map((mu) => ({
    ...mu,
    roundNumber: mu.roundNumber - roundOffset,
    roundPosition:
      mu.roundNumber === summaryRoundStart
        ? firstRoundMatchUps.findIndex((m) => m.roundPosition === mu.roundPosition) + 1
        : mu.roundPosition,
    drawPositions: mu.drawPositions.map((dp) => positionMap.get(dp) || dp),
  }));

  const finalMatchUps = renumberRoundPositions(renumbered);

  const summarySlots: DrawSlot[] = [];
  for (const [origPos, newP] of positionMap) {
    const slot = slots.find((s) => s.drawPosition === origPos);
    if (slot) {
      summarySlots.push({ ...slot, drawPosition: newP });
    }
  }
  summarySlots.sort((a, b) => a.drawPosition - b.drawPosition);

  const remappedLabels: Record<number, string> | undefined = roundLabelMap
    ? Object.fromEntries(
        Object.entries(roundLabelMap)
          .filter(([rn]) => Number(rn) >= summaryRoundStart)
          .map(([rn, label]) => [Number(rn) - roundOffset, label]),
      )
    : undefined;

  return {
    label: 'Final Rounds',
    startPosition: 1,
    endPosition: summaryDrawSize,
    slots: summarySlots,
    matchUps: finalMatchUps,
    segmentRounds: summaryRounds,
    roundLabelMap: remappedLabels,
  };
}

function renumberRoundPositions(matchUps: DrawMatchUp[]): DrawMatchUp[] {
  const byRound = new Map<number, DrawMatchUp[]>();
  for (const mu of matchUps) {
    if (!byRound.has(mu.roundNumber)) byRound.set(mu.roundNumber, []);
    byRound.get(mu.roundNumber)!.push(mu);
  }
  const result: DrawMatchUp[] = [];
  for (const [, roundMus] of byRound) {
    roundMus.sort((a, b) => a.roundPosition - b.roundPosition);
    roundMus.forEach((mu, idx) => {
      result.push({ ...mu, roundPosition: idx + 1 });
    });
  }
  return result;
}

function buildPositionMap(firstRoundMatchUps: DrawMatchUp[]): Map<number, number> {
  const positionMap = new Map<number, number>();
  let newPos = 1;
  for (const mu of firstRoundMatchUps) {
    for (const dp of mu.drawPositions) {
      if (dp && !positionMap.has(dp)) {
        positionMap.set(dp, newPos++);
      }
    }
  }
  return positionMap;
}
