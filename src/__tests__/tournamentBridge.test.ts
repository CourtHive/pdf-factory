import { describe, it, expect } from 'vitest';
import { buildHeaderFromTournament, buildFooterFromTournament } from '../composition/tournamentBridge';

const MOCK_TOURNAMENT = {
  tournamentId: 'T-2026-001',
  tournamentName: 'Summer Classic',
  formalName: 'The Summer Classic 2026',
  startDate: '2026-06-01',
  endDate: '2026-06-07',
  hostCountryCode: 'USA',
  surfaceCategory: 'HARD',
  tournamentLevel: 'NATIONAL',
  tournamentTier: { system: 'ITF_JUNIOR', value: 'J300' },
  totalPrizeMoney: [{ amount: 25000, currencyCode: 'USD' }],
  venues: [
    {
      venueName: 'City Tennis Center',
      addresses: [{ city: 'Austin', state: 'TX', countryCode: 'USA' }],
    },
  ],
  participants: [
    {
      participantName: 'Jane Director',
      participantRole: 'DIRECTOR',
      person: { standardGivenName: 'Jane', standardFamilyName: 'Director' },
    },
    {
      participantName: 'Bob Referee',
      participantRole: 'OFFICIAL',
      participantRoleResponsibilities: ['REFEREE'],
      person: { standardGivenName: 'Bob', standardFamilyName: 'Referee' },
    },
    {
      participantName: 'Carol Umpire',
      participantRole: 'OFFICIAL',
      participantRoleResponsibilities: ['CHIEF_UMPIRE'],
      person: { standardGivenName: 'Carol', standardFamilyName: 'Umpire' },
    },
    {
      participantName: 'Player One',
      participantRole: 'COMPETITOR',
      person: { standardGivenName: 'Player', standardFamilyName: 'One' },
    },
  ],
  registrationProfile: {
    drawCeremonyDate: '2026-06-01T18:00',
  },
};

describe('buildHeaderFromTournament', () => {
  it('populates all header fields from tournament data', () => {
    const header = buildHeaderFromTournament(MOCK_TOURNAMENT);

    expect(header.layout).toBe('itf');
    expect(header.tournamentName).toBe('The Summer Classic 2026');
    expect(header.startDate).toBe('2026-06-01');
    expect(header.endDate).toBe('2026-06-07');
    expect(header.location).toBe('Austin, TX, USA');
    expect(header.city).toBe('Austin');
    expect(header.country).toBe('USA');
    expect(header.surface).toBe('HARD');
    expect(header.grade).toBe('ITF_JUNIOR J300');
    expect(header.tournamentId).toBe('T-2026-001');
    expect(header.organizer).toBe('Director, Jane');
    expect(header.supervisor).toBe('Referee, Bob');
    expect(header.chiefUmpire).toBe('Umpire, Carol');
    expect(header.prizeMoney).toBe('25000');
    expect(header.currency).toBe('USD');
  });

  it('uses specified layout', () => {
    const header = buildHeaderFromTournament(MOCK_TOURNAMENT, { layout: 'grand-slam' });
    expect(header.layout).toBe('grand-slam');
  });

  it('applies overrides on top of auto-populated values', () => {
    const header = buildHeaderFromTournament(MOCK_TOURNAMENT, {
      overrides: { tournamentName: 'Custom Name', surface: 'CLAY' },
    });
    expect(header.tournamentName).toBe('Custom Name');
    expect(header.surface).toBe('CLAY');
    expect(header.startDate).toBe('2026-06-01');
  });

  it('sets sectionLabel from options', () => {
    const header = buildHeaderFromTournament(MOCK_TOURNAMENT, { sectionLabel: 'SINGLES MAIN DRAW' });
    expect(header.sectionLabel).toBe('SINGLES MAIN DRAW');
  });

  it('handles minimal tournament record gracefully', () => {
    const header = buildHeaderFromTournament({ tournamentName: 'Bare Minimum' });

    expect(header.tournamentName).toBe('Bare Minimum');
    expect(header.startDate).toBeUndefined();
    expect(header.location).toBe('');
    expect(header.organizer).toBeUndefined();
    expect(header.supervisor).toBeUndefined();
    expect(header.prizeMoney).toBeUndefined();
  });

  it('handles empty tournament record', () => {
    const header = buildHeaderFromTournament({});
    expect(header.tournamentName).toBe('');
    expect(header.layout).toBe('itf');
  });

  it('falls back to tournamentName when formalName is absent', () => {
    const header = buildHeaderFromTournament({ tournamentName: 'Basic Open' });
    expect(header.tournamentName).toBe('Basic Open');
  });

  it('falls back to tournamentLevel when no tier is set', () => {
    const record = { ...MOCK_TOURNAMENT, tournamentTier: undefined };
    const header = buildHeaderFromTournament(record);
    expect(header.grade).toBe('NATIONAL');
  });
});

describe('buildFooterFromTournament', () => {
  it('populates signature lines from officials', () => {
    const footer = buildFooterFromTournament(MOCK_TOURNAMENT);

    expect(footer.layout).toBe('standard');
    expect(footer.showPageNumbers).toBe(true);
    expect(footer.showTimestamp).toBe(true);
    expect(footer.signatureLines).toHaveLength(3);
    expect(footer.signatureLines?.[0].role).toBe('DIRECTOR');
    expect(footer.signatureLines?.[0].name).toBe('Director, Jane');
    expect(footer.signatureLines?.[1].role).toBe('REFEREE');
    expect(footer.signatureLines?.[2].role).toBe('CHIEF_UMPIRE');
  });

  it('passes through seed assignments', () => {
    const seeds = [
      { seedValue: 1, participantName: 'SINNER, Jannik', nationality: 'ITA', ranking: 1 },
      { seedValue: 2, participantName: 'ALCARAZ, Carlos', nationality: 'ESP', ranking: 2 },
    ];
    const footer = buildFooterFromTournament(MOCK_TOURNAMENT, {
      layout: 'seedings-table',
      seedAssignments: seeds,
    });
    expect(footer.layout).toBe('seedings-table');
    expect(footer.seedAssignments).toHaveLength(2);
  });

  it('passes through prize money per round', () => {
    const prizes = [
      { round: 'Winner', amount: '$25,000' },
      { round: 'Final', amount: '$12,500' },
    ];
    const footer = buildFooterFromTournament(MOCK_TOURNAMENT, {
      layout: 'prize-money',
      prizeMoney: prizes,
    });
    expect(footer.prizeMoney).toHaveLength(2);
  });

  it('includes draw ceremony date from registration profile', () => {
    const footer = buildFooterFromTournament(MOCK_TOURNAMENT);
    expect(footer.drawCeremonyDate).toBe('2026-06-01T18:00');
  });

  it('applies overrides', () => {
    const footer = buildFooterFromTournament(MOCK_TOURNAMENT, {
      overrides: { showPageNumbers: false, notes: ['Custom note'] },
    });
    expect(footer.showPageNumbers).toBe(false);
    expect(footer.notes).toEqual(['Custom note']);
  });

  it('handles tournament with no officials', () => {
    const record = { ...MOCK_TOURNAMENT, participants: [] };
    const footer = buildFooterFromTournament(record);
    expect(footer.signatureLines).toBeUndefined();
  });
});
