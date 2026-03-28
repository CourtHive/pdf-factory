import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../../core/extractDrawData';
import { renderTraditionalDraw } from '../../renderers/traditionalDraw';
import { createDoc, getPageRegions } from '../../composition/page';
import { renderHeader } from '../../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../../composition/footerLayouts';
import { getPreset } from '../../config/formatPresets';

const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(OUTPUT_DIR, { recursive: true });

function generateTraditionalPDF(drawSize: number, presetName: string, seedsCount: number = 4) {
  let result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize, eventName: 'Singles', seedsCount }],
    completeAllMatchUps: true,
    setState: true,
  });
  expect(result.success).toEqual(true);

  const format = getPreset(presetName);
  const info: any = tournamentEngine.getTournamentInfo();
  const events: any = tournamentEngine.getEvents();
  const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
  const participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });

  const drawData = extractDrawData({ drawDefinition, participants: participants.participants || [] });

  const doc = createDoc(format.page, drawSize);
  const footerHeight = measureFooterHeight({ layout: 'standard', showPageNumbers: true, showTimestamp: true });
  const headerHeight = renderHeader(
    doc,
    {
      layout: 'itf',
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
      subtitle: `Singles - ${presetName}`,
      startDate: info.tournamentInfo?.startDate,
    },
    format.page,
  );

  const regions = getPageRegions(doc, format.page, headerHeight, footerHeight);
  renderTraditionalDraw(doc, drawData, format, regions);
  renderFooter(doc, { layout: 'standard', showPageNumbers: true, showTimestamp: true }, format.page, 1);

  return { doc, drawData };
}

describe('Traditional draw renderer', () => {
  it('renders a 16-draw with ITF preset', () => {
    const { doc, drawData } = generateTraditionalPDF(16, 'itfJunior', 4);
    expect(drawData.drawSize).toEqual(16);

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'traditional-16-itf.pdf'), Buffer.from(pdfBytes));
  });

  it('renders a 32-draw with Wimbledon preset', () => {
    const { doc } = generateTraditionalPDF(32, 'wimbledon', 8);
    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'traditional-32-wimbledon.pdf'), Buffer.from(pdfBytes));
  });

  it('renders a 32-draw with Roland Garros preset', () => {
    const { doc } = generateTraditionalPDF(32, 'rolandGarros', 8);
    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'traditional-32-rg.pdf'), Buffer.from(pdfBytes));
  });

  it('renders a 32-draw with Australian Open preset', () => {
    const { doc } = generateTraditionalPDF(32, 'australianOpen', 8);
    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'traditional-32-ao.pdf'), Buffer.from(pdfBytes));
  });
});
