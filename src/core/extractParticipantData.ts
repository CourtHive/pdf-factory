import { participantName, nationality, entryStatusDisplay } from '../utils/primitives';

export interface ParticipantRow {
  name: string;
  nationality: string;
  ranking?: string;
  seedValue?: number;
  entryStatus: string;
  events: string[];
  signedIn?: boolean;
}

export function extractParticipantData(params: {
  participants?: any[];
  eventEntries?: { eventName: string; entries: any[] }[];
}): ParticipantRow[] {
  const { participants = [], eventEntries = [] } = params;

  const entryMap = new Map<string, { events: string[]; entryStatus: string; seedValue?: number }>();

  for (const { eventName, entries } of eventEntries) {
    for (const entry of entries) {
      const id = entry.participantId;
      if (!entryMap.has(id)) {
        entryMap.set(id, { events: [], entryStatus: '', seedValue: undefined });
      }
      const record = entryMap.get(id)!;
      record.events.push(eventName);
      if (entry.entryStatus) record.entryStatus = entry.entryStatus;
      if (entry.seedValue !== undefined && record.seedValue === undefined) {
        const numericSeed = Number(entry.seedValue);
        if (!Number.isNaN(numericSeed)) record.seedValue = numericSeed;
      }
    }
  }

  return participants
    .filter((p: any) => p.participantType === 'INDIVIDUAL')
    .map((p: any) => {
      const entry = entryMap.get(p.participantId);
      return {
        name: participantName(p),
        nationality: nationality(p),
        ranking: extractRanking(p),
        seedValue: entry?.seedValue,
        entryStatus: entryStatusDisplay(entry?.entryStatus || ''),
        events: entry?.events || [],
        signedIn: p.signInStatus === 'SIGNED_IN',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * `participant.rankings` populated by the factory's `withScaleValues` query
 * is shaped as `{ [matchUpType]: [{ scaleValue, scaleName, ... }] }`. Pick
 * the first available scaleValue as the displayed ranking. Falls back to
 * `participant.ratings` (same shape) when no rankings exist.
 */
function extractRanking(p: any): string {
  for (const source of [p.rankings, p.ratings]) {
    if (!source || typeof source !== 'object') continue;
    for (const list of Object.values(source) as any[][]) {
      const v = list?.[0]?.scaleValue;
      if (v !== undefined && v !== null && v !== '') return String(v);
    }
  }
  return '';
}
