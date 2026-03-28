import { participantName, nationality, formatScore } from '../utils/primitives';

export interface RoundRobinParticipant {
  participantName: string;
  nationality: string;
  seedValue?: number;
  groupPosition: number;
}

export interface RoundRobinResult {
  rowPosition: number;
  colPosition: number;
  score: string;
  winningSide?: number;
}

export interface RoundRobinGroupData {
  groupName: string;
  participants: RoundRobinParticipant[];
  results: RoundRobinResult[];
  standings?: {
    position: number;
    participantName: string;
    wins: number;
    losses: number;
    setsWon: number;
    setsLost: number;
  }[];
}

export function extractRoundRobinData(params: { structure: any; participants?: any[] }): RoundRobinGroupData[] {
  const { structure, participants = [] } = params;
  if (!structure) return [];

  const participantMap = new Map<string, any>();
  participants.forEach((p: any) => participantMap.set(p.participantId, p));

  // Round robin structures have structures (groups) as children
  const groups = structure.structures || [];
  if (!groups.length) return [];

  return groups.map((group: any, groupIndex: number) => {
    const positionAssignments = group.positionAssignments || [];
    const seedAssignments = group.seedAssignments || [];

    const rrParticipants: RoundRobinParticipant[] = positionAssignments
      .filter((pa: any) => pa.participantId)
      .map((pa: any) => {
        const p = participantMap.get(pa.participantId);
        const seed = seedAssignments.find((sa: any) => sa.participantId === pa.participantId);
        return {
          participantName: p ? participantName(p) : '',
          nationality: p ? nationality(p) : '',
          seedValue: seed?.seedValue,
          groupPosition: pa.drawPosition,
        };
      })
      .sort((a: RoundRobinParticipant, b: RoundRobinParticipant) => a.groupPosition - b.groupPosition);

    const results: RoundRobinResult[] = [];
    for (const mu of group.matchUps || []) {
      if (!mu.drawPositions || mu.drawPositions.length < 2) continue;
      const [pos1, pos2] = mu.drawPositions;
      const score = formatScore(mu.score);

      if (score) {
        results.push({
          rowPosition: pos1,
          colPosition: pos2,
          score,
          winningSide: mu.winningSide,
        });
      }
    }

    return {
      groupName: group.structureName || `Group ${groupIndex + 1}`,
      participants: rrParticipants,
      results,
    };
  });
}
