import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData, findStructure } from '../core/drawsDataToDrawData';
import { generateTraditionalDrawPDF, generateSplitDrawPDF } from '../generators/drawPDF';
import { PRESETS } from '../config/formatPresets';
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

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: args.drawSize, eventName: 'Singles', seedsCount: args.seedsCount, drawId }],
    completeAllMatchUps: args.completeAllMatchUps,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament</p>';
    return container;
  }

  const { eventData } = tournamentEngine.getEventData({ drawId }) as any;
  const mainStruct = findStructure(eventData?.drawsData || [], 'MAIN');
  const drawData = mainStruct
    ? structureToDrawData(mainStruct)
    : { drawName: '', drawSize: 0, drawType: '', totalRounds: 0, slots: [], matchUps: [], seedAssignments: [] };
  const info: any = tournamentEngine.getTournamentInfo();

  const pdfOpts = {
    header: {
      layout: args.headerLayout as HeaderLayout,
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
      subtitle: 'Singles',
    },
    footer: { layout: 'standard' as const, showPageNumbers: true, showTimestamp: true },
    preset: args.preset,
  };

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>${args.preset} - ${args.drawSize} Draw</h2>
    <p>Seeds: ${args.seedsCount} | Completed: ${args.completeAllMatchUps} | Header: ${args.headerLayout}</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => {
    generateTraditionalDrawPDF(drawData, pdfOpts).save(`draw-${args.drawSize}-${args.preset}.pdf`);
  });
  addButton(container, 'Preview in New Tab', '#2d8a4e', () => {
    window.open(URL.createObjectURL(generateTraditionalDrawPDF(drawData, pdfOpts).output('blob')));
  });

  if (args.drawSize >= 64) {
    addButton(container, 'Download Multi-Page', '#8a2d2d', () => {
      generateSplitDrawPDF(drawData, { ...pdfOpts, header: { ...pdfOpts.header, subtitle: '' } }).save(
        `draw-${args.drawSize}-split.pdf`,
      );
    });
    addButton(container, 'Preview Multi-Page', '#6b8a2d', () => {
      window.open(
        URL.createObjectURL(
          generateSplitDrawPDF(drawData, { ...pdfOpts, header: { ...pdfOpts.header, subtitle: '' } }).output('blob'),
        ),
      );
    });
  }

  return container;
}

function addButton(container: HTMLElement, label: string, color: string, onclick: () => void) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = `padding: 10px 24px; cursor: pointer; background: ${color}; color: white; border: none; border-radius: 4px; margin: 8px 4px;`;
  btn.onclick = onclick;
  container.appendChild(btn);
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
