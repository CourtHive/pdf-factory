import { participantName, nationality, formatScore, formatTime, eventAbbreviation } from '../utils/primitives';

export interface ScheduleMatch {
  courtName: string;
  scheduledTime: string;
  eventName: string;
  eventAbbr: string;
  roundName: string;
  side1: { name: string; nationality: string };
  side2: { name: string; nationality: string };
  score?: string;
  matchUpStatus?: string;
  notBeforeTime?: string;
}

export interface ScheduleTimeSlot {
  time: string;
  label: string;
  matches: ScheduleMatch[];
}

export interface ScheduleData {
  scheduledDate: string;
  courts: string[];
  timeSlots: ScheduleTimeSlot[];
}

export function extractScheduleData(params: {
  matchUps?: any[];
  venues?: any[];
  scheduledDate?: string;
}): ScheduleData {
  const { matchUps = [], venues = [], scheduledDate = '' } = params;

  const courtNames = new Set<string>();
  venues.forEach((v: any) => {
    (v.courts || []).forEach((c: any) => {
      courtNames.add(c.courtName || `Court ${c.courtId}`);
    });
  });

  const courtMap = new Map<string, string>();
  venues.forEach((v: any) => {
    (v.courts || []).forEach((c: any) => {
      courtMap.set(c.courtId, c.courtName || `Court ${c.courtId}`);
    });
  });

  const scheduled = matchUps.filter((mu: any) => mu.schedule?.scheduledDate === scheduledDate || !scheduledDate);

  const timeMap = new Map<string, ScheduleMatch[]>();

  for (const mu of scheduled) {
    const schedule = mu.schedule || {};
    const time = schedule.scheduledTime || '00:00';
    const courtId = schedule.venueCourtId || schedule.courtId || '';
    const courtName = courtMap.get(courtId) || courtId;

    if (courtName) courtNames.add(courtName);

    const sides = mu.sides || [];
    const side1 = extractSide(sides[0]);
    const side2 = extractSide(sides[1]);

    const match: ScheduleMatch = {
      courtName,
      scheduledTime: formatTime(time),
      eventName: mu.eventName || mu.event?.eventName || '',
      eventAbbr: eventAbbreviation(mu.eventName || mu.event?.eventName || ''),
      roundName: mu.roundName || '',
      side1,
      side2,
      score: formatScore(mu.score),
      matchUpStatus: mu.matchUpStatus,
      notBeforeTime: schedule.notBeforeTime ? formatTime(schedule.notBeforeTime) : undefined,
    };

    const key = schedule.notBeforeTime || time;
    if (!timeMap.has(key)) timeMap.set(key, []);
    timeMap.get(key)!.push(match);
  }

  const sortedTimes = [...timeMap.keys()].sort();
  const timeSlots: ScheduleTimeSlot[] = sortedTimes.map((time) => ({
    time,
    label: formatTime(time) || 'TBD',
    matches: timeMap.get(time) || [],
  }));

  return {
    scheduledDate,
    courts: [...courtNames].sort(),
    timeSlots,
  };
}

function extractSide(side: any): { name: string; nationality: string } {
  if (!side) return { name: '', nationality: '' };
  const participant = side.participant;
  if (!participant) return { name: '', nationality: '' };
  return {
    name: participantName(participant),
    nationality: nationality(participant),
  };
}
