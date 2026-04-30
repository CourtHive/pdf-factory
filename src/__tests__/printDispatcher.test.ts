import { describe, it, expect } from 'vitest';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { executePrint } from '../composition/printDispatcher';
import { composeOrderOfPlayOptions } from '../composition/composeOrderOfPlayOptions';

function setupScheduledTournament(drawSize = 16, courtsCount = 4) {
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize, eventName: 'Singles' }],
    venueProfiles: [{ courtsCount, venueName: 'Main Venue' }],
    autoSchedule: true,
    scheduleCompletedMatchUps: true,
    completeAllMatchUps: false,
    setState: true,
  });
  expect(result.success).toEqual(true);

  const info: any = tournamentEngine.getTournamentInfo();
  return { scheduledDate: info.tournamentInfo?.startDate as string };
}

describe('composeOrderOfPlayOptions', () => {
  it('applies defaults for empty composition', () => {
    const opts = composeOrderOfPlayOptions({});
    expect(opts.cellStyle).toBe('detailed');
    expect(opts.header).toBeUndefined();
    expect(opts.footer).toBeUndefined();
    expect(opts.page).toBeUndefined();
  });

  it('passes through header layout + tournamentName', () => {
    const opts = composeOrderOfPlayOptions({
      header: { layout: 'minimal', tournamentName: 'My Tournament' },
    });
    expect(opts.header?.layout).toBe('minimal');
    expect(opts.header?.tournamentName).toBe('My Tournament');
  });

  it('falls back to itf header layout when not provided', () => {
    const opts = composeOrderOfPlayOptions({ header: { tournamentName: 'X' } });
    expect(opts.header?.layout).toBe('itf');
  });

  it('passes through schedule content options', () => {
    const opts = composeOrderOfPlayOptions({
      content: {
        schedule: { cellStyle: 'compact', showMatchNumbers: true, alertBanner: 'Important!' },
      },
    });
    expect(opts.cellStyle).toBe('compact');
    expect(opts.showMatchNumbers).toBe(true);
    expect(opts.alertBanner).toBe('Important!');
  });
});

describe('executePrint — schedule branch', () => {
  it('rejects when tournamentEngine missing', () => {
    const result = executePrint({ type: 'schedule', scheduledDate: '2026-01-01', composition: {} }, undefined as any);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/tournamentEngine/);
  });

  it('rejects when scheduledDate missing', () => {
    const result = executePrint({ type: 'schedule', scheduledDate: '', composition: {} }, { tournamentEngine });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/scheduledDate/);
  });

  it('rejects when engine lacks expected methods', () => {
    const result = executePrint(
      { type: 'schedule', scheduledDate: '2026-01-01', composition: {} },
      { tournamentEngine: {} },
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/competitionScheduleMatchUps/);
  });

  it('produces a blob from a real scheduled tournament', () => {
    const { scheduledDate } = setupScheduledTournament();
    expect(scheduledDate).toBeTruthy();

    const result = executePrint(
      {
        type: 'schedule',
        scheduledDate,
        composition: {
          header: { layout: 'itf', tournamentName: 'Test', subtitle: `OOP — ${scheduledDate}` },
          footer: { layout: 'standard', showTimestamp: true, showPageNumbers: true },
        },
      },
      { tournamentEngine },
    );

    expect(result.success).toBe(true);
    expect(result.doc).toBeDefined();
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.filename).toBe(`order-of-play-${scheduledDate}.pdf`);
  });
});

describe('executePrint — unimplemented branches', () => {
  it.each(['draw', 'playerList', 'courtCards', 'signInSheet', 'matchCard'] as const)(
    'returns "not yet implemented" for type=%s',
    (type) => {
      const result = executePrint({ type, composition: {}, drawId: '', eventId: '', matchUpIds: [] } as any, {
        tournamentEngine,
      });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not yet implemented/);
    },
  );
});
