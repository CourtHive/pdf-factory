import type { DrawSplitConfig } from '../config/types';
import type { DrawData, DrawSlot, DrawMatchUp } from '../core/extractDrawData';

export interface DrawSegment {
  label: string;
  startPosition: number;
  endPosition: number;
  slots: DrawSlot[];
  matchUps: DrawMatchUp[];
  segmentRounds: number;
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
    const startPos = i * segmentSize + 1;
    const endPos = Math.min((i + 1) * segmentSize, drawSize);
    let segmentLabel = `Section ${i + 1}`;
    if (segmentCount === 2) segmentLabel = i === 0 ? 'Top Half' : 'Bottom Half';

    const segSlots = slots.filter((s) => s.drawPosition >= startPos && s.drawPosition <= endPos);

    // Include matchUps whose draw positions fall within this segment
    const segMatchUps = matchUps.filter((mu) => {
      if (mu.roundNumber > segmentRounds) return false;
      return mu.drawPositions.some((dp) => dp >= startPos && dp <= endPos);
    });

    segments.push({
      label: segmentLabel,
      startPosition: startPos,
      endPosition: endPos,
      slots: segSlots,
      matchUps: segMatchUps,
      segmentRounds,
    });
  }

  // Summary page: final rounds only
  if (config.summaryPage && segmentCount > 1) {
    const summaryRoundStart = segmentRounds + 1;
    const summaryMatchUps = matchUps.filter((mu) => mu.roundNumber >= summaryRoundStart);

    segments.push({
      label: 'Final Rounds',
      startPosition: 1,
      endPosition: drawSize,
      slots: [],
      matchUps: summaryMatchUps,
      segmentRounds: totalRounds - segmentRounds,
    });
  }

  return segments;
}
