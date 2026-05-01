/**
 * Integration smoke test: verify the seed pattern used by
 * `PrintDispatcher.stories.ts` actually produces tournament data that
 * makes the dispatcher's schedule + playerList branches render with
 * content (multiple time slots, populated rankings + seeds + entries).
 *
 * Without this test the storybook stories silently regress when
 * mocksEngine output shape shifts.
 */
import { describe, it, expect } from 'vitest';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { executePrint } from '../composition/printDispatcher';
import { extractScheduleData } from '../core/extractScheduleData';
import { extractParticipantData } from '../core/extractParticipantData';

function seed(drawSize = 16, courtsCount = 4) {
  mocksEngine.generateTournamentRecord({
    participantsProfile: {
      participantsCount: drawSize * 2,
      nationalityCodesCount: 16,
      category: { categoryName: 'U18' },
      rankingRange: [1, 200],
      scaleAllParticipants: true,
    },
    drawProfiles: [
      {
        drawSize,
        eventName: "Men's Singles",
        seedsCount: Math.max(2, Math.floor(drawSize / 4)),
      },
      {
        drawSize: Math.max(8, Math.floor(drawSize / 2)),
        eventName: "Women's Singles",
        gender: 'FEMALE',
        seedsCount: 4,
      },
    ],
    venueProfiles: [{ venueId: 'venue-1', courtsCount, venueName: 'Main Venue', startTime: '09:00', endTime: '20:00' }],
    setState: true,
  });

  const info: any = tournamentEngine.getTournamentInfo();
  const scheduledDate = info.tournamentInfo?.startDate;
  const startTimes = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];
  const venuesResult: any = tournamentEngine.getVenuesAndCourts();
  const courtIds: string[] = (venuesResult.venues?.[0]?.courts ?? []).map((c: any) => c.courtId);
  const allMatchUps: any[] = tournamentEngine.allTournamentMatchUps()?.matchUps ?? [];
  const firstRound = allMatchUps.filter((mu: any) => mu.roundNumber === 1 && mu.matchUpStatus !== 'BYE');

  const matchUpDetails = firstRound.map((mu: any, i: number) => ({
    tournamentId: info.tournamentInfo?.tournamentId,
    drawId: mu.drawId,
    matchUpId: mu.matchUpId,
    schedule: {
      scheduledDate,
      scheduledTime: startTimes[Math.floor(i / Math.max(1, courtIds.length)) % startTimes.length],
      courtId: courtIds[i % Math.max(1, courtIds.length)],
      venueId: 'venue-1',
    },
  }));
  if (matchUpDetails.length) tournamentEngine.bulkScheduleMatchUps({ matchUpDetails });
}

describe('PrintDispatcher story seed produces renderable data', () => {
  it('schedule branch yields a scheduleData with multiple time slots populated', () => {
    seed();
    const info: any = tournamentEngine.getTournamentInfo();
    const scheduleResult: any = tournamentEngine.competitionScheduleMatchUps();
    const venuesResult: any = tournamentEngine.getVenuesAndCourts();
    const matchUps = (scheduleResult.dateMatchUps ?? []).concat(scheduleResult.completedMatchUps ?? []);
    const data = extractScheduleData({
      matchUps,
      venues: venuesResult.venues ?? [],
      scheduledDate: info.tournamentInfo?.startDate,
    });

    expect(data.timeSlots.length).toBeGreaterThan(1);
    expect(data.courts.length).toBeGreaterThan(0);
    const allMatches = data.timeSlots.flatMap((s) => s.matches);
    const named = allMatches.filter((m) => m.side1.name && m.side2.name);
    expect(named.length).toBeGreaterThan(0);
  });

  it('playerList yields rows with ranking, seedValue, entryStatus, and events populated', () => {
    seed();
    const result = executePrint({ type: 'playerList', composition: {} }, { tournamentEngine });
    expect(result.success).toBe(true);

    // Re-derive the rows the same way the dispatcher does so we can assert
    // on the populated columns.
    const events = tournamentEngine.getEvents()?.events ?? [];
    const { participants = [] }: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
      withScaleValues: true,
      withSeeding: true,
    });
    const eventEntries = events.map((event: any) => {
      const seedMap = new Map<string, number>();
      for (const drawDef of event.drawDefinitions ?? []) {
        for (const structure of drawDef.structures ?? []) {
          if (structure.stage && structure.stage !== 'MAIN') continue;
          for (const sa of structure.seedAssignments ?? []) {
            if (sa?.participantId && sa.seedValue !== undefined) {
              const num = Number(sa.seedValue);
              if (!Number.isNaN(num) && !seedMap.has(sa.participantId)) seedMap.set(sa.participantId, num);
            }
          }
        }
      }
      return {
        eventName: event.eventName ?? '',
        entries: (event.entries ?? []).map((e: any) =>
          seedMap.has(e.participantId) ? { ...e, seedValue: seedMap.get(e.participantId) } : e,
        ),
      };
    });

    const rows = extractParticipantData({ participants, eventEntries });

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.events.length > 0)).toBe(true);
    expect(rows.some((r) => r.entryStatus)).toBe(true);
    expect(rows.some((r) => r.seedValue !== undefined)).toBe(true);
    expect(rows.some((r) => r.ranking)).toBe(true);
  });
});
