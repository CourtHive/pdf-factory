import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractRoundRobinData } from '../../core/extractRoundRobinData';
import { renderRoundRobinGroup } from '../../renderers/roundRobinDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { measureFooterHeight } from '../../composition/footerLayouts';
import { getPreset } from '../../config/formatPresets';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Round robin renderer', () => {
  it('extracts and renders round robin groups', () => {
    let result: any = mocksEngine.generateTournamentRecord({
      drawProfiles: [{ drawSize: 8, drawType: 'ROUND_ROBIN', eventName: 'RR Singles' }],
      completeAllMatchUps: true,
      setState: true,
    });
    expect(result.success).toEqual(true);

    const events: any = tournamentEngine.getEvents();
    const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
    expect(drawDefinition).toBeDefined();

    const participants: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });

    const mainStructure = drawDefinition.structures?.[0];
    const groups = extractRoundRobinData({
      structure: mainStructure,
      participants: participants.participants || [],
    });

    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].participants.length).toBeGreaterThan(0);
    expect(groups[0].results.length).toBeGreaterThan(0);
    expect(groups[0].groupName).toBeDefined();

    // Render to PDF
    const format = getPreset('itfJunior');
    const doc = createDoc(format.page, 8);
    const footerHeight = measureFooterHeight({ layout: 'standard', showPageNumbers: true, showTimestamp: true });
    const headerHeight = renderHeader(
      doc,
      { layout: 'itf', tournamentName: 'Club Championship', subtitle: 'Round Robin Singles' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerHeight, footerHeight);

    let y = regions.contentY;
    for (const group of groups) {
      y = renderRoundRobinGroup(doc, group, format, regions, y) + 6;
    }

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'round-robin-8.pdf'), Buffer.from(pdfBytes));
  });

  it('handles empty round robin data', () => {
    const groups = extractRoundRobinData({ structure: undefined, participants: [] });
    expect(groups).toEqual([]);
  });
});
