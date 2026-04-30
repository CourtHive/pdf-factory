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

describe('executePrint — playerList branch', () => {
  it('produces a player list PDF when no event filter', () => {
    setupScheduledTournament();
    const result = executePrint(
      { type: 'playerList', composition: { header: { tournamentName: 'Test' } } },
      { tournamentEngine },
    );
    expect(result.success).toBe(true);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.filename).toMatch(/^player-list-/);
  });

  it('filters to event participants when eventId provided', () => {
    setupScheduledTournament();
    const events = tournamentEngine.getEvents();
    const eventId = events.events?.[0]?.eventId;
    expect(eventId).toBeTruthy();
    const result = executePrint({ type: 'playerList', eventId, composition: {} }, { tournamentEngine });
    expect(result.success).toBe(true);
    expect(result.filename).not.toBe('player-list-all.pdf');
  });
});

describe('executePrint — signInSheet branch', () => {
  it('rejects without eventId', () => {
    const result = executePrint({ type: 'signInSheet', eventId: '', composition: {} }, { tournamentEngine });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/eventId/);
  });

  it('produces a sign-in-sheet PDF for an event', () => {
    setupScheduledTournament();
    const events = tournamentEngine.getEvents();
    const eventId = events.events?.[0]?.eventId;
    const result = executePrint(
      { type: 'signInSheet', eventId, composition: { header: { tournamentName: 'Test' } } },
      { tournamentEngine },
    );
    expect(result.success).toBe(true);
    expect(result.blob).toBeInstanceOf(Blob);
  });
});

describe('executePrint — courtCards branch', () => {
  it('produces a court-cards PDF for a scheduled date', () => {
    const { scheduledDate } = setupScheduledTournament();
    const result = executePrint(
      { type: 'courtCards', scheduledDate, composition: { header: { tournamentName: 'Test' } } },
      { tournamentEngine },
    );
    expect(result.success).toBe(true);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.filename).toBe(`court-cards-${scheduledDate}.pdf`);
  });
});

describe('executePrint — matchCard branch', () => {
  it('rejects with empty matchUpIds', () => {
    const result = executePrint({ type: 'matchCard', matchUpIds: [], composition: {} }, { tournamentEngine });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/matchUpIds/);
  });

  it('rejects when no matchUps match the requested ids', () => {
    setupScheduledTournament();
    const result = executePrint(
      { type: 'matchCard', matchUpIds: ['nonexistent'], composition: {} },
      { tournamentEngine },
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No matchUps/);
  });

  it('produces a match-card PDF for known matchUpIds', () => {
    setupScheduledTournament();
    const { matchUps = [] } = tournamentEngine.allTournamentMatchUps();
    const matchUpIds = matchUps.slice(0, 2).map((mu: any) => mu.matchUpId);
    const result = executePrint({ type: 'matchCard', matchUpIds, composition: {} }, { tournamentEngine });
    expect(result.success).toBe(true);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.filename).toBe(`match-cards-${matchUpIds.length}.pdf`);
  });
});

describe('executePrint — draw branch', () => {
  it('rejects without drawId', () => {
    const result = executePrint({ type: 'draw', drawId: '', eventId: '', composition: {} }, { tournamentEngine });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/drawId/);
  });

  it('rejects when draw not found', () => {
    setupScheduledTournament();
    const result = executePrint(
      { type: 'draw', drawId: 'nonexistent', eventId: 'nonexistent', composition: {} },
      { tournamentEngine },
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No draw data/);
  });

  it('produces a draw PDF for a real tournament', () => {
    setupScheduledTournament();
    const events = tournamentEngine.getEvents();
    const event = events.events?.[0];
    const drawId = event?.drawDefinitions?.[0]?.drawId;
    expect(drawId).toBeTruthy();

    const result = executePrint(
      { type: 'draw', drawId, eventId: event.eventId, composition: { header: { tournamentName: 'Test' } } },
      { tournamentEngine },
    );
    expect(result.success).toBe(true);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.filename).toMatch(/^draw-/);
  });
});
