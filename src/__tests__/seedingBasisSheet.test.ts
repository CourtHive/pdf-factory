import { describe, it, expect } from 'vitest';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../core/extractDrawData';
import { generateDrawSheetPDF } from '../generators/drawSheet';
import { measureFooterHeight } from '../composition/footerLayouts';

const DAGGER_WINANSI = String.fromCharCode(0x86);

/**
 * A 32-draw whose ninth seed carries a protected-ranking basis.
 *
 * Built WITHOUT `addAdditionalSeed`, deliberately. pdf-factory's job is to RENDER
 * `seedingBasis`; it takes plain objects and never imports the factory at runtime (peer only). A
 * test that reached for the mutation would couple this suite to a factory version that mints the
 * field, which is the opposite of the decoupling that lets this repo ship ahead of that release —
 * and is exactly what turned CI red the first time.
 *
 * `enforcePolicyLimits: false` is the 7.0.0-era route to a ninth seed above the ITF threshold of
 * eight. The basis is then set on the assignment directly, because that is all the renderer reads.
 */
function seededDraw() {
  const { tournamentRecord }: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: 32, participantsCount: 32, seedsCount: 9, enforcePolicyLimits: false }],
    nonRandom: 1,
    setState: true,
  });

  const drawDefinition = tournamentRecord.events[0].drawDefinitions[0];
  const structure = drawDefinition.structures[0];
  expect(structure.seedAssignments).toHaveLength(9);

  const ninth = structure.seedAssignments.find((assignment: any) => assignment.seedNumber === 9);
  expect(ninth?.participantId).toBeTruthy();
  ninth.seedingBasis = 'PROTECTED_RANKING';

  const participants = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  }).participants;

  return { drawDefinition, participants };
}

describe('seedingBasis reaches the printed sheet', () => {
  it('extractDrawData carries the basis out of the structure', () => {
    const { drawDefinition, participants } = seededDraw();
    const drawData = extractDrawData({ drawDefinition, participants });

    expect(drawData.seedAssignments).toHaveLength(9);

    const additional = drawData.seedAssignments.filter((s) => s.seedingBasis);
    expect(additional).toHaveLength(1);
    expect(additional[0].seedingBasis).toEqual('PROTECTED_RANKING');
    expect(additional[0].participantName).toBeTruthy();

    // and the eight ordinary seeds carry nothing, because absent means RANKING
    expect(drawData.seedAssignments.filter((s) => !s.seedingBasis)).toHaveLength(8);
  });

  it('the marker and its footnote reach the PDF content stream', () => {
    const { drawDefinition, participants } = seededDraw();
    const drawData = extractDrawData({ drawDefinition, participants });
    const doc = generateDrawSheetPDF(drawData, { includeSeedings: true });
    const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');

    // The dagger is WinAnsi 0x86, so jsPDF's standard Helvetica renders it with no embedded font —
    // the same encoding path the em dash in footerLayouts already relies on. Measured, not assumed.
    expect(raw).toContain(DAGGER_WINANSI);
    expect(raw).toContain('Additional seed');
    expect(raw).toContain('protected ranking');
  });

  it('an ordinary draw prints no marker and no footnote', () => {
    // The control. Without it, a test asserting the marker's presence proves only that the string
    // exists somewhere, not that it appears because of the basis.
    const { tournamentRecord }: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 32, participantsCount: 32, seedsCount: 8 }],
      nonRandom: 1,
      setState: true,
    });
    const drawDefinition = tournamentRecord.events[0].drawDefinitions[0];
    const participants = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    }).participants;

    const drawData = extractDrawData({ drawDefinition, participants });
    expect(drawData.seedAssignments.some((s) => s.seedingBasis)).toBe(false);

    const doc = generateDrawSheetPDF(drawData, { includeSeedings: true });
    const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1');
    expect(raw).not.toContain(DAGGER_WINANSI);
    expect(raw).not.toContain('Additional seed');
  });
});

describe('measureFooterHeight reserves room for the footnote', () => {
  const seeds = (count: number, basis?: string) =>
    Array.from({ length: count }, (_, index) => ({
      seedValue: index + 1,
      participantName: `P${index + 1}`,
      ...(basis && index === count - 1 ? { seedingBasis: basis } : {}),
    }));

  it('a seedings footer grows by one line per distinct basis', () => {
    const plain = measureFooterHeight({ layout: 'seedings-table', seedAssignments: seeds(8) } as any);
    const marked = measureFooterHeight({
      layout: 'seedings-table',
      seedAssignments: seeds(8, 'PROTECTED_RANKING'),
    } as any);
    expect(marked).toEqual(plain + 3);
  });

  it('the combined-tour footer measures one line PER SEED, not per pair', () => {
    // It renders seeds in a single column at 2.5 per line, so the previous ceil(n/2)*3 under-
    // measured it by roughly half and the last entries were drawn below the reserved band.
    const four = measureFooterHeight({ layout: 'combined-tour', seedAssignments: seeds(4) } as any);
    const eight = measureFooterHeight({ layout: 'combined-tour', seedAssignments: seeds(8) } as any);
    expect(eight - four).toEqual(4 * 2.5);
  });
});
