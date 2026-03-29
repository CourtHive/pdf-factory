import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractConsolationStructures } from '../../renderers/consolationDraw';
import { renderDoubleEliminationDraw, type DoubleEliminationData } from '../../renderers/doubleEliminationDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { measureFooterHeight } from '../../composition/footerLayouts';
import { getPreset } from '../../config/formatPresets';
import { pdf } from 'pdf-to-img';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(resolve(OUTPUT_DIR, 'fidelity'), { recursive: true });

describe('Double elimination renderer', () => {
  it('renders an 8-player double elimination draw', async () => {
    // Factory doesn't have DOUBLE_ELIMINATION well supported in mocksEngine,
    // so we simulate with FIRST_MATCH_LOSER_CONSOLATION which has similar structure
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 8, drawType: 'FIRST_MATCH_LOSER_CONSOLATION', eventName: 'Double Elim' }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });

    const structures = extractConsolationStructures({ drawDefinition, participants: participants.participants || [] });
    const main = structures.find((s) => s.stage === 'MAIN');
    const consolation = structures.find((s) => s.stage === 'CONSOLATION');

    expect(main).toBeDefined();

    const data: DoubleEliminationData = {
      winnersBracket: main!.drawData,
      losersBracket: consolation?.drawData || {
        drawName: '',
        drawSize: 0,
        drawType: '',
        totalRounds: 0,
        slots: [],
        matchUps: [],
        seedAssignments: [],
      },
      championshipMatch: {},
    };

    const format = getPreset('usta');
    const doc = createDoc({ ...format.page, orientation: 'landscape' }, 8);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'Club Championship', subtitle: '8-Player Double Elimination' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    renderDoubleEliminationDraw(doc, data, format, regions);

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'double-elim-8.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/double-elim-8-page${pageNum}.png`), page);
    }
  });

  it('renders a 16-player double elimination draw', async () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 16, drawType: 'FIRST_MATCH_LOSER_CONSOLATION', eventName: 'Double Elim' }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });

    const structures = extractConsolationStructures({ drawDefinition, participants: participants.participants || [] });
    const main = structures.find((s) => s.stage === 'MAIN');
    const consolation = structures.find((s) => s.stage === 'CONSOLATION');

    const data: DoubleEliminationData = {
      winnersBracket: main!.drawData,
      losersBracket: consolation?.drawData || {
        drawName: '',
        drawSize: 0,
        drawType: '',
        totalRounds: 0,
        slots: [],
        matchUps: [],
        seedAssignments: [],
      },
      championshipMatch: {},
    };

    const format = getPreset('usta');
    const doc = createDoc({ ...format.page, orientation: 'landscape' }, 16);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'Regional Championship', subtitle: '16-Player Double Elimination' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);

    renderDoubleEliminationDraw(doc, data, format, regions);

    const pdfBytes = doc.output('arraybuffer');
    writeFileSync(resolve(OUTPUT_DIR, 'double-elim-16.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/double-elim-16-page${pageNum}.png`), page);
    }
  });
});
