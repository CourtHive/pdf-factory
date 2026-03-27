import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractParticipantData } from '../core/extractParticipantData';
import { generatePlayerListPDF } from '../generators/playerList';

const OUTPUT_DIR = resolve(__dirname, '__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Player List PDF', () => {
  it('generates a player list from tournament participants', () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 32, eventName: 'Singles' }],
      setState: true,
    });
    expect(result.success).toEqual(true);

    let info: any = tournamentEngine.getTournamentInfo();
    const tournamentName = info.tournamentInfo?.tournamentName || 'Test Tournament';

    result = tournamentEngine.getParticipants({ participantFilters: { participantTypes: ['INDIVIDUAL'] } });
    const participants = result.participants || [];
    expect(participants.length).toBeGreaterThan(0);

    result = tournamentEngine.getEvents();
    const events = result.events || [];

    const eventEntries = events.map((e: any) => ({
      eventName: e.eventName,
      entries: e.entries || [],
    }));

    const players = extractParticipantData({ participants, eventEntries });
    expect(players.length).toBeGreaterThan(0);
    expect(players[0].name).toBeTruthy();

    const doc = generatePlayerListPDF(players, {
      header: {
        tournamentName,
        startDate: info.tournamentInfo?.startDate,
        endDate: info.tournamentInfo?.endDate,
      },
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);

    writeFileSync(resolve(OUTPUT_DIR, 'player-list.pdf'), Buffer.from(pdfBytes));
  });

  it('handles empty participant data', () => {
    const players = extractParticipantData({ participants: [], eventEntries: [] });
    expect(players).toEqual([]);
  });
});
