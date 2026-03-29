/**
 * Extract data for compass draws.
 *
 * A compass draw has up to 8 structures named by compass directions:
 * East (main), West, North, NE, South, SW, NW, SE.
 * Each structure is a small single-elimination bracket.
 */

import { participantName, nationality } from '../utils/primitives';
import type { DrawSlot, DrawMatchUp } from './extractDrawData';

export interface CompassStructure {
  name: string;
  abbreviation: string;
  drawSize: number;
  slots: DrawSlot[];
  matchUps: DrawMatchUp[];
  totalRounds: number;
}

export interface CompassDrawData {
  drawName: string;
  structures: CompassStructure[];
  mainStructure?: CompassStructure;
}

const COMPASS_NAMES: Record<string, { name: string; abbreviation: string }> = {
  East: { name: 'East', abbreviation: 'E' },
  West: { name: 'West', abbreviation: 'W' },
  North: { name: 'North', abbreviation: 'N' },
  South: { name: 'South', abbreviation: 'S' },
  Northeast: { name: 'Northeast', abbreviation: 'NE' },
  Northwest: { name: 'Northwest', abbreviation: 'NW' },
  Southeast: { name: 'Southeast', abbreviation: 'SE' },
  Southwest: { name: 'Southwest', abbreviation: 'SW' },
};

export function extractCompassData(params: { drawDefinition: any; participants?: any[] }): CompassDrawData {
  const { drawDefinition, participants = [] } = params;
  if (!drawDefinition) return { drawName: '', structures: [] };

  const participantMap = new Map<string, any>();
  participants.forEach((p: any) => participantMap.set(p.participantId, p));

  const structures: CompassStructure[] = [];

  for (const structure of drawDefinition.structures || []) {
    const structureName = structure.structureName || '';
    const compassInfo = COMPASS_NAMES[structureName] || { name: structureName, abbreviation: structureName };

    const positionAssignments = structure.positionAssignments || [];
    const seedAssignments = structure.seedAssignments || [];
    const drawSize = positionAssignments.length || 0;

    const slots: DrawSlot[] = positionAssignments.map((pa: any) => {
      const participant = pa.participantId ? participantMap.get(pa.participantId) : undefined;
      const seedAssignment = seedAssignments.find((sa: any) => sa.participantId === pa.participantId);

      return {
        drawPosition: pa.drawPosition,
        participantName: participant ? participantName(participant) : '',
        nationality: participant ? nationality(participant) : '',
        seedValue: seedAssignment?.seedValue,
        isBye: pa.bye === true,
      };
    });

    const matchUps: DrawMatchUp[] = (structure.matchUps || []).map((mu: any) => ({
      roundNumber: mu.roundNumber,
      roundPosition: mu.roundPosition,
      drawPositions: mu.drawPositions || [],
      score: mu.score?.scoreStringSide1 || '',
      winningSide: mu.winningSide,
      matchUpStatus: mu.matchUpStatus,
    }));

    structures.push({
      name: compassInfo.name,
      abbreviation: compassInfo.abbreviation,
      drawSize,
      slots,
      matchUps,
      totalRounds: drawSize > 0 ? Math.log2(drawSize) : 0,
    });
  }

  // Main structure is "East"
  const mainStructure = structures.find((s) => s.abbreviation === 'E');

  return {
    drawName: drawDefinition.drawName || '',
    structures,
    mainStructure,
  };
}
