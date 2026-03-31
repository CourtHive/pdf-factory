import { participantName, nationality, formatScore, roundName } from '../utils/primitives';

export interface DrawSlot {
  drawPosition: number;
  participantName: string;
  nationality: string;
  seedValue?: number;
  entryStatus?: string;
  isBye?: boolean;
}

export interface DrawMatchUp {
  roundNumber: number;
  roundPosition: number;
  drawPositions: number[];
  score?: string;
  winningSide?: number;
  matchUpStatus?: string;
}

export interface DrawData {
  drawName: string;
  drawSize: number;
  drawType: string;
  totalRounds: number;
  slots: DrawSlot[];
  matchUps: DrawMatchUp[];
  seedAssignments: { seedValue: number; participantName: string; nationality: string }[];
  roundLabelMap?: Record<number, string>;
  noWinnerColumn?: boolean;
}

export function extractDrawData(params: {
  drawDefinition: any;
  participants?: any[];
  structureId?: string;
  processedMatchUps?: any[];
}): DrawData {
  const { drawDefinition, participants = [] } = params;
  if (!drawDefinition) return emptyDrawData();

  const structure = params.structureId
    ? drawDefinition.structures?.find((s: any) => s.structureId === params.structureId)
    : drawDefinition.structures?.[0];

  if (!structure) return emptyDrawData();

  const participantMap = new Map<string, any>();
  participants.forEach((p: any) => participantMap.set(p.participantId, p));

  const positionAssignments = structure.positionAssignments || [];
  const matchUpsRaw = structure.matchUps || [];
  const maxRound = matchUpsRaw.reduce((max: number, mu: any) => Math.max(max, mu.roundNumber || 0), 0);

  // For sub-structures (consolation, backdraw), use position count and actual round count
  // rather than the main drawDefinition.drawSize which refers to the overall draw
  const drawSize = params.structureId
    ? positionAssignments.length
    : drawDefinition.drawSize || positionAssignments.length;
  const totalRounds = params.structureId ? maxRound : Math.log2(drawSize);

  // seedAssignments live on the structure, not the drawDefinition
  const structureSeedAssignments = structure.seedAssignments || [];

  const slots: DrawSlot[] = positionAssignments.map((pa: any) => {
    const participant = pa.participantId ? participantMap.get(pa.participantId) : undefined;
    const seedAssignment = structureSeedAssignments.find((sa: any) => sa.participantId === pa.participantId);

    return {
      drawPosition: pa.drawPosition,
      participantName: participant ? participantName(participant) : '',
      nationality: participant ? nationality(participant) : '',
      seedValue: seedAssignment?.seedValue,
      entryStatus: pa.entryStatus,
      isBye: pa.bye === true,
    };
  });

  const matchUps: DrawMatchUp[] = (structure.matchUps || []).map((mu: any) => ({
    roundNumber: mu.roundNumber,
    roundPosition: mu.roundPosition,
    drawPositions: mu.drawPositions || [],
    score: formatScore(mu.score),
    winningSide: mu.winningSide,
    matchUpStatus: mu.matchUpStatus,
  }));

  const seedAssignments = structureSeedAssignments
    .filter((sa: any) => sa.participantId)
    .map((sa: any) => {
      const participant = participantMap.get(sa.participantId);
      return {
        seedValue: sa.seedValue,
        participantName: participant ? participantName(participant) : '',
        nationality: participant ? nationality(participant) : '',
      };
    })
    .sort((a: any, b: any) => a.seedValue - b.seedValue);

  // Build round label map from engine-processed matchUps (preferred) or heuristic
  const roundLabelMap = buildRoundLabelMap(matchUps, totalRounds, params.processedMatchUps);

  return {
    drawName: drawDefinition.drawName || '',
    drawSize,
    drawType: drawDefinition.drawType || 'SINGLE_ELIMINATION',
    totalRounds,
    slots,
    matchUps,
    seedAssignments,
    roundLabelMap,
  };
}

export function getRoundLabel(roundNumber: number, totalRounds: number): string {
  return roundName(roundNumber, totalRounds);
}

function buildRoundLabelMap(
  matchUps: DrawMatchUp[],
  totalRounds: number,
  processedMatchUps?: any[],
): Record<number, string> {
  // Use engine-provided roundName/abbreviatedRoundName when available
  if (processedMatchUps?.length) {
    const map: Record<number, string> = {};
    for (const mu of processedMatchUps) {
      if (mu.roundNumber && !map[mu.roundNumber]) {
        map[mu.roundNumber] = mu.abbreviatedRoundName || mu.roundName || `R${mu.roundNumber}`;
      }
    }
    if (Object.keys(map).length > 0) return map;
  }

  // Fallback: count matches per round
  const roundCounts = new Map<number, number>();
  for (const mu of matchUps) {
    roundCounts.set(mu.roundNumber, (roundCounts.get(mu.roundNumber) || 0) + 1);
  }

  const rounds = [...roundCounts.keys()].sort((a, b) => a - b);
  const isPowerOf2 =
    rounds.length > 0 &&
    rounds.every((r, i) => {
      if (i === 0) return true;
      const prev = roundCounts.get(rounds[i - 1]) || 0;
      const curr = roundCounts.get(r) || 0;
      return curr <= Math.ceil(prev / 2);
    });

  // Standard single-elimination: use traditional labels
  if (isPowerOf2) {
    const map: Record<number, string> = {};
    for (const r of rounds) {
      map[r] = roundName(r, totalRounds);
    }
    return map;
  }

  // Feed structure: simple round number labels as fallback
  const map: Record<number, string> = {};
  for (const r of rounds) {
    map[r] = `R${r}`;
  }
  return map;
}

function emptyDrawData(): DrawData {
  return {
    drawName: '',
    drawSize: 0,
    drawType: '',
    totalRounds: 0,
    slots: [],
    matchUps: [],
    seedAssignments: [],
  };
}
