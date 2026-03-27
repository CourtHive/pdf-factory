import { participantName, nationality, formatTime } from '../utils/primitives';

export interface CourtCardData {
  courtName: string;
  venueName?: string;
  currentMatch?: CourtCardMatch;
  nextMatch?: CourtCardMatch;
}

export interface CourtCardMatch {
  eventName: string;
  roundName: string;
  scheduledTime?: string;
  side1: { name: string; nationality: string };
  side2: { name: string; nationality: string };
}

export function extractCourtCardData(params: {
  matchUps?: any[];
  venues?: any[];
  scheduledDate?: string;
}): CourtCardData[] {
  const { matchUps = [], venues = [] } = params;

  const courtMap = new Map<string, { courtName: string; venueName: string }>();
  venues.forEach((v: any) => {
    (v.courts || []).forEach((c: any) => {
      courtMap.set(c.courtId, {
        courtName: c.courtName || `Court ${c.courtId}`,
        venueName: v.venueName || '',
      });
    });
  });

  // Group matchUps by court
  const courtMatchUps = new Map<string, any[]>();
  for (const mu of matchUps) {
    const courtId = mu.schedule?.venueCourtId || mu.schedule?.courtId;
    if (!courtId) continue;
    if (!courtMatchUps.has(courtId)) courtMatchUps.set(courtId, []);
    courtMatchUps.get(courtId)!.push(mu);
  }

  const cards: CourtCardData[] = [];

  for (const [courtId, matches] of courtMatchUps) {
    const courtInfo = courtMap.get(courtId) || { courtName: courtId, venueName: '' };

    // Sort by scheduled time
    matches.sort((a: any, b: any) => {
      const ta = a.schedule?.scheduledTime || '';
      const tb = b.schedule?.scheduledTime || '';
      return ta.localeCompare(tb);
    });

    // Find current (IN_PROGRESS or first upcoming) and next
    const inProgress = matches.find((m: any) => m.matchUpStatus === 'IN_PROGRESS');
    const upcoming = matches.filter(
      (m: any) => !['COMPLETED', 'RETIRED', 'WALKOVER', 'DEFAULTED', 'ABANDONED'].includes(m.matchUpStatus),
    );

    const currentMu = inProgress || upcoming[0];
    const nextMu = inProgress ? upcoming.find((m: any) => m !== inProgress) : upcoming[1];

    cards.push({
      courtName: courtInfo.courtName,
      venueName: courtInfo.venueName,
      currentMatch: currentMu ? mapCourtCardMatch(currentMu) : undefined,
      nextMatch: nextMu ? mapCourtCardMatch(nextMu) : undefined,
    });
  }

  return cards.sort((a, b) => a.courtName.localeCompare(b.courtName));
}

function mapCourtCardMatch(mu: any): CourtCardMatch {
  const sides = mu.sides || [];
  return {
    eventName: mu.eventName || mu.event?.eventName || '',
    roundName: mu.roundName || '',
    scheduledTime: mu.schedule?.scheduledTime ? formatTime(mu.schedule.scheduledTime) : undefined,
    side1: extractSide(sides[0]),
    side2: extractSide(sides[1]),
  };
}

function extractSide(side: any): { name: string; nationality: string } {
  if (!side?.participant) return { name: 'TBD', nationality: '' };
  return {
    name: participantName(side.participant),
    nationality: nationality(side.participant),
  };
}
