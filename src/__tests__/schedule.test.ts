import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractScheduleData } from '../core/extractScheduleData';
import { generateSchedulePDF } from '../generators/schedule';

const OUTPUT_DIR = resolve(__dirname, '__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Schedule PDF', () => {
  it('generates an order of play from a scheduled tournament', () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 16 }],
      venueProfiles: [{ courtsCount: 6, venueName: 'Main Venue' }],
      completeAllMatchUps: false,
      autoSchedule: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    let info: any = tournamentEngine.getTournamentInfo();
    const tournamentName = info.tournamentInfo?.tournamentName || 'Test Tournament';
    const startDate = info.tournamentInfo?.startDate;

    result = tournamentEngine.competitionScheduleMatchUps();
    const matchUps = (result.dateMatchUps || []).concat(result.completedMatchUps || []);

    let venuesResult: any = tournamentEngine.getVenuesAndCourts();
    const venues = venuesResult.venues || [];

    const scheduleData = extractScheduleData({ matchUps, venues, scheduledDate: startDate });

    const doc = generateSchedulePDF(scheduleData, {
      header: {
        tournamentName,
        startDate,
        subtitle: `Order of Play - ${startDate}`,
      },
      landscape: 'auto',
      notes: ['All times are local.', 'Matches may be moved to any court.'],
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);

    writeFileSync(resolve(OUTPUT_DIR, 'schedule.pdf'), Buffer.from(pdfBytes));
  });

  it('handles empty schedule data', () => {
    const data = extractScheduleData({ matchUps: [], venues: [] });
    expect(data.courts).toEqual([]);
    expect(data.timeSlots).toEqual([]);
  });
});
