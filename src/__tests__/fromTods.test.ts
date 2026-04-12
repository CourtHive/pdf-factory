import { describe, it, expect } from 'vitest';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../core/extractDrawData';
import { extractParticipantData } from '../core/extractParticipantData';
import { generateDrawSheetPDF } from '../generators/drawSheet';
import { generatePlayerListPDF } from '../generators/playerList';
import { hasFixtures, FIXTURES_DIR } from './fixtureGuard';

const OUTPUT_DIR = resolve(__dirname, '__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe.skipIf(!hasFixtures)('Generate PDFs from J300.tods fixture', () => {
  it('loads J300.tods and generates draw sheets', () => {
    const todsJson = readFileSync(resolve(FIXTURES_DIR, 'J300.tods'), 'utf-8');
    const tournamentRecord = JSON.parse(todsJson);
    expect(tournamentRecord.tournamentName).toBeDefined();

    let result: any = tournamentEngine.setState(tournamentRecord);
    expect(result.success).toEqual(true);

    let info: any = tournamentEngine.getTournamentInfo();
    const tournamentName = info.tournamentInfo?.tournamentName || 'J300 Tucson';

    result = tournamentEngine.getParticipants({ participantFilters: { participantTypes: ['INDIVIDUAL'] } });
    const participants = result.participants || [];
    expect(participants.length).toBeGreaterThan(0);

    result = tournamentEngine.getEvents();
    const events = result.events || [];
    expect(events.length).toBeGreaterThan(0);

    // Generate a draw sheet for each event
    for (const event of events) {
      const drawDefinition = event.drawDefinitions?.[0];
      if (!drawDefinition) continue;

      const drawData = extractDrawData({ drawDefinition, participants });
      if (drawData.drawSize === 0) continue;

      const doc = generateDrawSheetPDF(drawData, {
        header: {
          tournamentName,
          startDate: info.tournamentInfo?.startDate,
          endDate: info.tournamentInfo?.endDate,
          location: 'Tucson, USA',
        },
        includeSeedings: true,
      });

      const safeName = event.eventName.replace(/[^a-zA-Z0-9]/g, '_');
      const pdfBytes = doc.output('arraybuffer');
      expect(pdfBytes.byteLength).toBeGreaterThan(0);

      writeFileSync(resolve(OUTPUT_DIR, `J300-${safeName}.pdf`), Buffer.from(pdfBytes));
    }
  });

  it('loads J300.tods and generates a player list', () => {
    const todsJson = readFileSync(resolve(FIXTURES_DIR, 'J300.tods'), 'utf-8');
    const tournamentRecord = JSON.parse(todsJson);

    let result: any = tournamentEngine.setState(tournamentRecord);
    expect(result.success).toEqual(true);

    let info: any = tournamentEngine.getTournamentInfo();
    const tournamentName = info.tournamentInfo?.tournamentName || 'J300 Tucson';

    result = tournamentEngine.getParticipants({ participantFilters: { participantTypes: ['INDIVIDUAL'] } });
    const participants = result.participants || [];

    result = tournamentEngine.getEvents();
    const events = result.events || [];

    const eventEntries = events.map((e: any) => ({
      eventName: e.eventName,
      entries: e.entries || [],
    }));

    const players = extractParticipantData({ participants, eventEntries });
    expect(players.length).toBeGreaterThan(0);

    const doc = generatePlayerListPDF(players, {
      header: {
        tournamentName,
        startDate: info.tournamentInfo?.startDate,
        location: 'Tucson, USA',
      },
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);

    writeFileSync(resolve(OUTPUT_DIR, 'J300-player-list.pdf'), Buffer.from(pdfBytes));
  });
});
