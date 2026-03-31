/**
 * Converts drawsData structures (from tournamentEngine.getEventData())
 * into DrawData for pdf-factory renderers.
 *
 * This is the standard data pipeline for TMX integration:
 *   getEventData({ drawId }) → eventData.drawsData → structureToDrawData() → renderer
 */

import type { DrawData, DrawSlot, DrawMatchUp } from './extractDrawData';

/** Convert a single drawsData structure into DrawData */
export function structureToDrawData(struct: any): DrawData {
  const roundMatchUps = struct.roundMatchUps || {};
  const roundProfile = struct.roundProfile || {};
  const roundNumbers = Object.keys(roundMatchUps)
    .map(Number)
    .sort((a, b) => a - b);

  // Build slots from all matchUp sides (deduplicate by drawPosition)
  const slotMap = new Map<number, DrawSlot>();
  for (const rn of roundNumbers) {
    for (const mu of roundMatchUps[rn] || []) {
      for (const side of mu.sides || []) {
        if (side?.drawPosition && !slotMap.has(side.drawPosition)) {
          slotMap.set(side.drawPosition, {
            drawPosition: side.drawPosition,
            participantName: side.participant?.participantName || '',
            nationality: side.participant?.nationalityCode || '',
            seedValue: side.seedValue,
            entryStatus: side.participant?.entryStatus,
            isBye: side.bye === true,
          });
        }
      }
    }
  }

  // Build matchUps
  const matchUps: DrawMatchUp[] = [];
  for (const rn of roundNumbers) {
    for (const mu of roundMatchUps[rn] || []) {
      matchUps.push({
        roundNumber: mu.roundNumber,
        roundPosition: mu.roundPosition,
        drawPositions: mu.drawPositions || [],
        score: mu.score?.scoreStringSide1 || '',
        winningSide: mu.winningSide,
        matchUpStatus: mu.matchUpStatus,
      });
    }
  }

  // Build roundLabelMap from roundProfile
  const roundLabelMap: Record<number, string> = {};
  for (const rn of roundNumbers) {
    const rp = roundProfile[rn];
    roundLabelMap[rn] = rp?.abbreviatedRoundName || rp?.roundName || `R${rn}`;
  }

  const totalRounds = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 0;
  const slots = [...slotMap.values()].sort((a, b) => a.drawPosition - b.drawPosition);

  return {
    drawName: struct.structureName || '',
    drawSize: slots.length,
    drawType: 'SINGLE_ELIMINATION',
    totalRounds,
    slots,
    matchUps,
    seedAssignments: (struct.seedAssignments || [])
      .filter((sa: any) => sa.participantName)
      .map((sa: any) => ({
        seedValue: sa.seedValue,
        participantName: sa.participantName || '',
        nationality: sa.nationalityCode || '',
      })),
    roundLabelMap,
  };
}

/** Find a structure by stage from drawsData */
export function findStructure(drawsData: any[], stage: string): any {
  return drawsData?.[0]?.structures?.find((s: any) => s.stage === stage);
}
