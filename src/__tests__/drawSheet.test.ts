import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../core/extractDrawData';
import { generateDrawSheetPDF } from '../generators/drawSheet';

const OUTPUT_DIR = resolve(__dirname, '__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Draw Sheet PDF', () => {
  it('generates a 16-draw elimination bracket', () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 16, eventName: 'Boys Singles', seedsCount: 4 }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    let info: any = tournamentEngine.getTournamentInfo();
    const tournamentName = info.tournamentInfo?.tournamentName || 'Test Tournament';

    result = tournamentEngine.getEvents();
    const event = result.events?.[0];
    expect(event).toBeDefined();

    const drawDefinition = event.drawDefinitions?.[0];
    expect(drawDefinition).toBeDefined();

    result = tournamentEngine.getParticipants({ participantFilters: { participantTypes: ['INDIVIDUAL'] } });
    const participants = result.participants || [];

    const drawData = extractDrawData({ drawDefinition, participants });
    expect(drawData.drawSize).toEqual(16);
    expect(drawData.slots.length).toBeGreaterThan(0);
    expect(drawData.seedAssignments.length).toBeGreaterThanOrEqual(4);

    const doc = generateDrawSheetPDF(drawData, {
      header: {
        tournamentName,
        startDate: info.tournamentInfo?.startDate,
      },
      includeSeedings: true,
      includeScores: true,
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);

    writeFileSync(resolve(OUTPUT_DIR, 'draw-16.pdf'), Buffer.from(pdfBytes));
  });

  it('generates a 32-draw elimination bracket', () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 32, eventName: 'Girls Singles', seedsCount: 8 }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    let info: any = tournamentEngine.getTournamentInfo();

    result = tournamentEngine.getEvents();
    const drawDefinition = result.events?.[0]?.drawDefinitions?.[0];

    result = tournamentEngine.getParticipants({ participantFilters: { participantTypes: ['INDIVIDUAL'] } });
    const participants = result.participants || [];

    const drawData = extractDrawData({ drawDefinition, participants });
    expect(drawData.drawSize).toEqual(32);

    const doc = generateDrawSheetPDF(drawData, {
      header: {
        tournamentName: info.tournamentInfo?.tournamentName || 'Test Tournament',
        startDate: info.tournamentInfo?.startDate,
      },
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);

    writeFileSync(resolve(OUTPUT_DIR, 'draw-32.pdf'), Buffer.from(pdfBytes));
  });

  it('handles empty draw data gracefully', () => {
    const drawData = extractDrawData({ drawDefinition: undefined, participants: [] });
    expect(drawData.drawSize).toEqual(0);
    expect(drawData.slots).toEqual([]);
  });
});
