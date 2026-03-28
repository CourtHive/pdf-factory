import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../../core/extractDrawData';
import { splitDraw } from '../../renderers/drawSplitter';
import { renderTraditionalDraw } from '../../renderers/traditionalDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../../composition/footerLayouts';
import { getPreset } from '../../config/formatPresets';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

describe('Draw splitter', () => {
  it('does not split a 32-draw', () => {
    const drawData = makeDrawData(32);
    const segments = splitDraw(drawData, { maxPositionsPerPage: 64, includeOverlapRounds: true, summaryPage: true });
    expect(segments.length).toEqual(1);
    expect(segments[0].label).toEqual('Full Draw');
  });

  it('splits a 64-draw into 2 halves + summary', () => {
    const drawData = makeDrawData(64);
    const segments = splitDraw(drawData, { maxPositionsPerPage: 32, includeOverlapRounds: true, summaryPage: true });
    expect(segments.length).toEqual(3);
    expect(segments[0].label).toEqual('Top Half');
    expect(segments[1].label).toEqual('Bottom Half');
    expect(segments[2].label).toEqual('Final Rounds');
  });

  it('splits a 128-draw into 2 halves + summary (64 per page)', () => {
    const drawData = makeDrawData(128);
    const segments = splitDraw(drawData, { maxPositionsPerPage: 64, includeOverlapRounds: true, summaryPage: true });
    expect(segments.length).toEqual(3);
    expect(segments[0].slots.length).toBeGreaterThan(0);
    expect(segments[1].slots.length).toBeGreaterThan(0);
    expect(segments[0].startPosition).toEqual(1);
    expect(segments[0].endPosition).toEqual(64);
    expect(segments[1].startPosition).toEqual(65);
    expect(segments[1].endPosition).toEqual(128);
  });

  it('splits a 128-draw into 4 quarters + summary (32 per page)', () => {
    const drawData = makeDrawData(128);
    const segments = splitDraw(drawData, { maxPositionsPerPage: 32, includeOverlapRounds: true, summaryPage: true });
    expect(segments.length).toEqual(5);
    expect(segments[0].label).toContain('Section 1');
    expect(segments[3].label).toContain('Section 4');
    expect(segments[4].label).toEqual('Final Rounds');
  });

  it('renders a multi-page 64-draw PDF', () => {
    const drawData = makeDrawData(64);
    const segments = splitDraw(drawData, { maxPositionsPerPage: 32, includeOverlapRounds: true, summaryPage: true });
    const format = getPreset('wimbledon');
    const doc = createDoc(format.page, 64);
    const footerHeight = measureFooterHeight({ layout: 'standard', showPageNumbers: true, showTimestamp: true });

    for (let i = 0; i < segments.length; i++) {
      if (i > 0) doc.addPage();

      const seg = segments[i];
      const headerHeight = renderHeader(
        doc,
        { layout: 'grand-slam', tournamentName: 'Test Open', subtitle: `Singles - ${seg.label}` },
        format.page,
      );
      const regions = getPageRegions(doc, format.page, headerHeight, footerHeight);

      if (seg.slots.length > 0) {
        // Create a sub-drawData for this segment
        const segDrawData = { ...drawData, slots: seg.slots, matchUps: seg.matchUps };
        renderTraditionalDraw(
          doc,
          segDrawData,
          format,
          regions,
          seg.startPosition - 1,
          seg.endPosition - seg.startPosition + 1,
        );
      }

      renderFooter(doc, { layout: 'standard', showPageNumbers: true, showTimestamp: true }, format.page, i + 1);
    }

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'traditional-64-split-wimbledon.pdf'), Buffer.from(pdfBytes));
  });
});

function makeDrawData(drawSize: number) {
  let result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize, eventName: 'Singles', seedsCount: Math.min(16, drawSize / 2) }],
    completeAllMatchUps: true,
    setState: true,
  });
  expect(result.success).toEqual(true);

  const events: any = tournamentEngine.getEvents();
  const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
  const participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });

  return extractDrawData({ drawDefinition, participants: participants.participants || [] });
}
