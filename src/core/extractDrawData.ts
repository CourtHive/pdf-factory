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
}

export function extractDrawData(params: { drawDefinition: any; participants?: any[]; structureId?: string }): DrawData {
  const { drawDefinition, participants = [] } = params;
  if (!drawDefinition) return emptyDrawData();

  const structure = params.structureId
    ? drawDefinition.structures?.find((s: any) => s.structureId === params.structureId)
    : drawDefinition.structures?.[0];

  if (!structure) return emptyDrawData();

  const participantMap = new Map<string, any>();
  participants.forEach((p: any) => participantMap.set(p.participantId, p));

  const positionAssignments = structure.positionAssignments || [];
  const drawSize = drawDefinition.drawSize || positionAssignments.length;
  const totalRounds = Math.log2(drawSize);

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

  return {
    drawName: drawDefinition.drawName || '',
    drawSize,
    drawType: drawDefinition.drawType || 'SINGLE_ELIMINATION',
    totalRounds,
    slots,
    matchUps,
    seedAssignments,
  };
}

export function getRoundLabel(roundNumber: number, totalRounds: number): string {
  return roundName(roundNumber, totalRounds);
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
