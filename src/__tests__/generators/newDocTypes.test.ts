import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractParticipantData } from '../../core/extractParticipantData';
import { generateSignInSheetPDF } from '../../generators/signInSheet';
import { generateMatchCardPDF, type MatchCardData } from '../../generators/matchCard';

const REGIONAL_CHAMPIONSHIP = 'Regional Championship';
const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Sign-in sheet', () => {
  it('generates a sign-in sheet from tournament participants', () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 32, eventName: 'Singles' }],
      setState: true,
    });
    expect(result.success).toEqual(true);

    let info: any = tournamentEngine.getTournamentInfo();
    result = tournamentEngine.getParticipants({ participantFilters: { participantTypes: ['INDIVIDUAL'] } });
    let events: any = tournamentEngine.getEvents();

    const eventEntries = (events.events || []).map((e: any) => ({
      eventName: e.eventName,
      entries: e.entries || [],
    }));

    const players = extractParticipantData({ participants: result.participants || [], eventEntries });

    const doc = generateSignInSheetPDF(players, {
      header: {
        tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
        startDate: info.tournamentInfo?.startDate,
      },
      eventName: 'Singles',
      signInDate: info.tournamentInfo?.startDate,
      signInTime: '9:00 AM',
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'sign-in-sheet.pdf'), Buffer.from(pdfBytes));
  });
});

describe('Match card', () => {
  it('generates match cards', () => {
    const matches: MatchCardData[] = [
      {
        tournamentName: REGIONAL_CHAMPIONSHIP,
        eventName: 'Boys Singles',
        roundName: 'Quarter-Finals',
        courtName: 'Court 1',
        scheduledTime: '10:00 AM',
        side1: { name: 'SINNER, Jannik', nationality: 'ITA', seedValue: 1 },
        side2: { name: 'ALCARAZ, Carlos', nationality: 'ESP', seedValue: 3 },
      },
      {
        tournamentName: REGIONAL_CHAMPIONSHIP,
        eventName: 'Boys Singles',
        roundName: 'Quarter-Finals',
        courtName: 'Court 2',
        scheduledTime: '10:00 AM',
        side1: { name: 'DJOKOVIC, Novak', nationality: 'SRB', seedValue: 2 },
        side2: { name: 'MEDVEDEV, Daniil', nationality: 'RUS', seedValue: 4 },
      },
      {
        tournamentName: REGIONAL_CHAMPIONSHIP,
        eventName: 'Girls Singles',
        roundName: 'Semi-Finals',
        courtName: 'Court 1',
        scheduledTime: '2:00 PM',
        side1: { name: 'SABALENKA, Aryna', nationality: 'BLR', seedValue: 1 },
        side2: { name: 'GAUFF, Coco', nationality: 'USA', seedValue: 3 },
      },
    ];

    const doc = generateMatchCardPDF(matches, { cardsPerPage: 1 });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'match-cards.pdf'), Buffer.from(pdfBytes));
  });
});
