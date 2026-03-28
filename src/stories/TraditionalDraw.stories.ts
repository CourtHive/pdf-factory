import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../core/extractDrawData';
import { renderTraditionalDraw } from '../renderers/traditionalDraw';
import { splitDraw } from '../renderers/drawSplitter';
import { createDoc, getPageRegions } from '../composition/page';
import { renderHeader } from '../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../composition/footerLayouts';
import { getPreset, PRESETS } from '../config/formatPresets';
import type { HeaderLayout } from '../config/types';

interface TraditionalDrawArgs {
  drawSize: number;
  seedsCount: number;
  preset: string;
  headerLayout: HeaderLayout;
  completeAllMatchUps: boolean;
}

function createStory(args: TraditionalDrawArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: args.drawSize, eventName: 'Singles', seedsCount: args.seedsCount }],
    completeAllMatchUps: args.completeAllMatchUps,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament</p>';
    return container;
  }

  const format = getPreset(args.preset);
  const info: any = tournamentEngine.getTournamentInfo();
  const events: any = tournamentEngine.getEvents();
  const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
  const participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });
  const drawData = extractDrawData({ drawDefinition, participants: participants.participants || [] });

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `
    <h2>${args.preset} - ${args.drawSize} Draw</h2>
    <p>Seeds: ${args.seedsCount} | Completed: ${args.completeAllMatchUps} | Header: ${args.headerLayout}</p>
  `;
  container.appendChild(infoDiv);

  // Download button
  const btn = document.createElement('button');
  btn.textContent = 'Download PDF';
  btn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #1e3c78; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
  btn.onclick = () => {
    const doc = buildDoc(drawData, format, args, info);
    doc.save(`draw-${args.drawSize}-${args.preset}.pdf`);
  };
  container.appendChild(btn);

  // Preview button
  const previewBtn = document.createElement('button');
  previewBtn.textContent = 'Preview in New Tab';
  previewBtn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #2d8a4e; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
  previewBtn.onclick = () => {
    const doc = buildDoc(drawData, format, args, info);
    window.open(URL.createObjectURL(doc.output('blob')));
  };
  container.appendChild(previewBtn);

  // Multi-page split button (for 64+)
  if (args.drawSize >= 64) {
    const splitBtn = document.createElement('button');
    splitBtn.textContent = 'Download Split (Multi-Page)';
    splitBtn.style.cssText =
      'padding: 10px 24px; cursor: pointer; background: #8a2d2d; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
    splitBtn.onclick = () => {
      const segments = splitDraw(drawData, { maxPositionsPerPage: 32, includeOverlapRounds: true, summaryPage: true });
      const doc = createDoc(format.page, args.drawSize);
      const footerH = measureFooterHeight({ layout: 'standard', showPageNumbers: true, showTimestamp: true });

      for (let i = 0; i < segments.length; i++) {
        if (i > 0) doc.addPage();
        const seg = segments[i];
        const headerH = renderHeader(
          doc,
          {
            layout: args.headerLayout,
            tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
            subtitle: seg.label,
          },
          format.page,
        );
        const regions = getPageRegions(doc, format.page, headerH, footerH);
        if (seg.slots.length > 0) {
          const segData = { ...drawData, slots: seg.slots, matchUps: seg.matchUps };
          renderTraditionalDraw(
            doc,
            segData,
            format,
            regions,
            seg.startPosition - 1,
            seg.endPosition - seg.startPosition + 1,
          );
        }
        renderFooter(doc, { layout: 'standard', showPageNumbers: true, showTimestamp: true }, format.page, i + 1);
      }
      doc.save(`draw-${args.drawSize}-${args.preset}-split.pdf`);
    };
    container.appendChild(splitBtn);
  }

  return container;
}

function buildDoc(drawData: any, format: any, args: TraditionalDrawArgs, info: any) {
  const doc = createDoc(format.page, args.drawSize);
  const footerH = measureFooterHeight({ layout: 'standard', showPageNumbers: true, showTimestamp: true });
  const headerH = renderHeader(
    doc,
    {
      layout: args.headerLayout,
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
      subtitle: `Singles - ${args.preset}`,
    },
    format.page,
  );
  const regions = getPageRegions(doc, format.page, headerH, footerH);
  renderTraditionalDraw(doc, drawData, format, regions);
  renderFooter(doc, { layout: 'standard', showPageNumbers: true, showTimestamp: true }, format.page, 1);
  return doc;
}

const meta: Meta<TraditionalDrawArgs> = {
  title: 'PDF/Traditional Draw',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32, 64, 128] },
    seedsCount: { control: { type: 'range', min: 0, max: 16, step: 1 } },
    preset: { control: { type: 'select' }, options: Object.keys(PRESETS) },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'minimal', 'none'] },
    completeAllMatchUps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<TraditionalDrawArgs>;

export const Wimbledon32: Story = {
  args: { drawSize: 32, seedsCount: 8, preset: 'wimbledon', headerLayout: 'grand-slam', completeAllMatchUps: true },
};

export const RolandGarros64: Story = {
  args: { drawSize: 64, seedsCount: 16, preset: 'rolandGarros', headerLayout: 'grand-slam', completeAllMatchUps: true },
};

export const ITFJunior16: Story = {
  args: { drawSize: 16, seedsCount: 4, preset: 'itfJunior', headerLayout: 'itf', completeAllMatchUps: false },
};

export const AustralianOpen128: Story = {
  args: {
    drawSize: 128,
    seedsCount: 16,
    preset: 'australianOpen',
    headerLayout: 'grand-slam',
    completeAllMatchUps: true,
  },
};
