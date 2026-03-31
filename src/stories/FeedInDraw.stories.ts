import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData } from '../core/drawsDataToDrawData';
import { generateFeedInDrawPDF } from '../generators/drawPDF';
import { PRESETS } from '../config/formatPresets';
import type { HeaderLayout } from '../config/types';

interface FeedInDrawArgs {
  drawSize: number;
  drawType: string;
  seedsCount: number;
  preset: string;
  headerLayout: HeaderLayout;
  completeAllMatchUps: boolean;
  structure: 'main' | 'consolation';
}

function createStory(args: FeedInDrawArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [
      {
        drawSize: args.drawSize,
        drawType: args.drawType,
        eventName: 'Feed-In Singles',
        seedsCount: args.seedsCount,
        drawId,
      },
    ],
    completeAllMatchUps: args.completeAllMatchUps,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = `<p style="color:red">Failed to generate ${args.drawType} draw (size ${args.drawSize})</p>`;
    return container;
  }

  const { eventData } = tournamentEngine.getEventData({ drawId }) as any;
  const structures = eventData?.drawsData?.[0]?.structures || [];
  const stage = args.structure === 'consolation' ? 'CONSOLATION' : 'MAIN';
  const targetStruct = structures.find((s: any) => s.stage === stage) || structures[0];

  if (!targetStruct) {
    container.innerHTML = '<p style="color:red">No matching structure found</p>';
    return container;
  }

  const drawData = structureToDrawData(targetStruct);
  const info: any = tournamentEngine.getTournamentInfo();

  const pdfOpts = {
    header: {
      layout: args.headerLayout as HeaderLayout,
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
      subtitle: `${targetStruct.structureName} - ${args.drawType.replace(/_/g, ' ')}`,
    },
    preset: args.preset,
  };

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>${args.drawType.replace(/_/g, ' ')} - ${args.drawSize} Draw</h2>
    <p>Structure: ${targetStruct.structureName} (${targetStruct.stage}) | Positions: ${drawData.slots.length} | Rounds: ${drawData.totalRounds}</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => {
    generateFeedInDrawPDF(drawData, pdfOpts).save(`feed-in-${args.drawSize}-${args.structure}.pdf`);
  });
  addButton(container, 'Preview in New Tab', '#2d8a4e', () => {
    window.open(URL.createObjectURL(generateFeedInDrawPDF(drawData, pdfOpts).output('blob')));
  });

  return container;
}

function addButton(container: HTMLElement, label: string, color: string, onclick: () => void) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = `padding: 10px 24px; cursor: pointer; background: ${color}; color: white; border: none; border-radius: 4px; margin: 8px 4px;`;
  btn.onclick = onclick;
  container.appendChild(btn);
}

const meta: Meta<FeedInDrawArgs> = {
  title: 'PDF/Feed-In Draw',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [12, 16, 24, 32] },
    drawType: {
      control: { type: 'select' },
      options: ['FEED_IN', 'FEED_IN_CHAMPIONSHIP', 'FEED_IN_CHAMPIONSHIP_TO_QF', 'FEED_IN_CHAMPIONSHIP_TO_SF'],
    },
    seedsCount: { control: { type: 'range', min: 0, max: 8, step: 1 } },
    preset: { control: { type: 'select' }, options: Object.keys(PRESETS) },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'minimal', 'none'] },
    completeAllMatchUps: { control: 'boolean' },
    structure: { control: { type: 'select' }, options: ['main', 'consolation'] },
  },
};

export default meta;
type Story = StoryObj<FeedInDrawArgs>;

export const FeedIn12Main: Story = {
  args: {
    drawSize: 12,
    drawType: 'FEED_IN',
    seedsCount: 4,
    preset: 'itfJunior',
    headerLayout: 'itf',
    completeAllMatchUps: true,
    structure: 'main',
  },
};
export const FeedIn24Main: Story = {
  args: {
    drawSize: 24,
    drawType: 'FEED_IN',
    seedsCount: 8,
    preset: 'usta',
    headerLayout: 'itf',
    completeAllMatchUps: true,
    structure: 'main',
  },
};
export const FICConsolation16: Story = {
  args: {
    drawSize: 16,
    drawType: 'FEED_IN_CHAMPIONSHIP',
    seedsCount: 4,
    preset: 'itfJunior',
    headerLayout: 'itf',
    completeAllMatchUps: true,
    structure: 'consolation',
  },
};
export const FICConsolation32: Story = {
  args: {
    drawSize: 32,
    drawType: 'FEED_IN_CHAMPIONSHIP',
    seedsCount: 8,
    preset: 'usta',
    headerLayout: 'itf',
    completeAllMatchUps: true,
    structure: 'consolation',
  },
};
export const FeedIn12Incomplete: Story = {
  args: {
    drawSize: 12,
    drawType: 'FEED_IN',
    seedsCount: 0,
    preset: 'itfJunior',
    headerLayout: 'minimal',
    completeAllMatchUps: false,
    structure: 'main',
  },
};
