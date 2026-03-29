import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractScheduleData } from '../../core/extractScheduleData';
import { generateScheduleV2PDF } from '../../generators/scheduleV2';
import { pdf } from 'pdf-to-img';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(resolve(OUTPUT_DIR, 'fidelity'), { recursive: true });

function setupScheduledTournament(drawSize: number, courtsCount: number) {
  let result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize, eventName: 'Singles' }],
    venueProfiles: [{ courtsCount, venueName: 'Main Venue' }],
    autoSchedule: true,
    scheduleCompletedMatchUps: true,
    completeAllMatchUps: false,
    setState: true,
  });
  expect(result.success).toEqual(true);

  let info: any = tournamentEngine.getTournamentInfo();
  let scheduleResult: any = tournamentEngine.competitionScheduleMatchUps();
  let venues: any = tournamentEngine.getVenuesAndCourts();

  return {
    info: info.tournamentInfo,
    matchUps: (scheduleResult.dateMatchUps || []).concat(scheduleResult.completedMatchUps || []),
    venues: venues.venues || [],
    startDate: info.tournamentInfo?.startDate,
  };
}

describe('Schedule V2 — professional OOP', () => {
  it('generates 5-court OOP landscape (ITF J300 style)', async () => {
    const { info, matchUps, venues, startDate } = setupScheduledTournament(32, 5);

    const scheduleData = extractScheduleData({ matchUps, venues, scheduledDate: startDate });

    const doc = generateScheduleV2PDF(scheduleData, {
      header: {
        layout: 'itf',
        tournamentName: info?.tournamentName || 'J300 Tucson',
        subtitle: `ORDER OF PLAY\n${startDate || 'Monday'}`,
        startDate,
        location: 'Tucson, USA',
        grade: 'J300',
        supervisor: 'Douglas Rice',
      },
      notes: [
        'Any necessary weather updates will be posted on the OP.',
        'Lucky Loser sign-in CLOSES @ 9:30 a.m.',
        'Doubles Registration CLOSES @ 12:00 p.m.',
      ],
      officials: [
        { role: 'Order of Play released by', name: '' },
        { role: 'Tournament Director', name: 'Milena Patel' },
        { role: 'Supervisor', name: 'Douglas Rice' },
      ],
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'oop-5-courts-landscape.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/oop-5-courts-page${pageNum}.png`), page);
    }
  });

  it('generates 3-court OOP portrait (small venue)', async () => {
    const { info, matchUps, venues, startDate } = setupScheduledTournament(16, 3);

    const scheduleData = extractScheduleData({ matchUps, venues, scheduledDate: startDate });

    const doc = generateScheduleV2PDF(scheduleData, {
      header: {
        layout: 'minimal',
        tournamentName: info?.tournamentName || 'Club Championship',
        subtitle: `Order of Play - ${startDate}`,
      },
      page: { orientation: 'portrait' },
    });

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'oop-3-courts-portrait.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/oop-3-courts-page${pageNum}.png`), page);
    }
  });

  it('generates 8-court OOP landscape (Grand Slam style)', async () => {
    const { info, matchUps, venues, startDate } = setupScheduledTournament(64, 8);

    const scheduleData = extractScheduleData({ matchUps, venues, scheduledDate: startDate });

    const doc = generateScheduleV2PDF(scheduleData, {
      header: {
        layout: 'grand-slam',
        tournamentName: info?.tournamentName || 'Open Championship',
        subtitle: `ORDER OF PLAY - Day 1`,
        startDate,
        location: 'Melbourne, Australia',
      },
      alertBanner: 'PLAY STARTS AT 11:00 AM ON ALL COURTS',
      notes: [
        'All times are local. Matches may be moved to any court.',
        'Players must report 15 minutes before scheduled match time.',
      ],
      officials: [
        { role: 'Chief Umpire', name: 'Carlos Ramos' },
        { role: 'Tournament Director', name: 'Craig Tiley' },
        { role: 'Supervisor', name: 'Wayne McEwen' },
      ],
      cellStyle: 'compact',
    });

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'oop-8-courts-grand-slam.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/oop-8-courts-page${pageNum}.png`), page);
    }
  });

  it('generates 10-court OOP (large venue)', async () => {
    const { info, matchUps, venues, startDate } = setupScheduledTournament(64, 10);

    const scheduleData = extractScheduleData({ matchUps, venues, scheduledDate: startDate });

    const doc = generateScheduleV2PDF(scheduleData, {
      header: {
        layout: 'itf',
        tournamentName: info?.tournamentName || 'WTA 1000',
        subtitle: 'ORDER OF PLAY',
        startDate,
      },
      cellStyle: 'compact',
    });

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'oop-10-courts.pdf'), Buffer.from(pdfBytes));
  });
});
