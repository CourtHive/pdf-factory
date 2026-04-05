import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData, findStructure } from '../core/drawsDataToDrawData';
import { generateTraditionalDrawPDF } from '../generators/drawPDF';
import { PRESETS } from '../config/formatPresets';
import type { HeaderLayout } from '../config/types';

const QUALIFYING = 'QUALIFYING';
const GRAND_SLAM = 'grand-slam';

interface QualifyingDrawArgs {
  drawSize: number;
  qualifyingDrawSize: number;
  qualifyingPositions: number;
  seedsCount: number;
  preset: string;
  headerLayout: HeaderLayout;
  completeAllMatchUps: boolean;
}

function createStory(args: QualifyingDrawArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [
      {
        drawSize: args.drawSize,
        eventName: 'Singles',
        seedsCount: args.seedsCount,
        drawId,
        qualifyingProfiles: [
          {
            roundTarget: 1,
            structureProfiles: [
              {
                drawSize: args.qualifyingDrawSize,
                qualifyingPositions: args.qualifyingPositions,
              },
            ],
          },
        ],
      },
    ],
    completeAllMatchUps: args.completeAllMatchUps,
    randomWinningSide: true,
    setState: true,
  });

  console.log({ args, result });

  if (!result.success) {
    container.innerHTML = `<p style="color:red">Failed to generate tournament: ${JSON.stringify(result)}</p>`;
    return container;
  }

  const { eventData } = tournamentEngine.getEventData({ drawId });
  const qualStruct = findStructure(eventData?.drawsData || [], QUALIFYING);

  if (!qualStruct) {
    container.innerHTML = '<p style="color:red">No qualifying structure found</p>';
    return container;
  }

  const drawData = structureToDrawData(qualStruct);
  const info: any = tournamentEngine.getTournamentInfo();

  const qualRounds = drawData.totalRounds;
  const label = `Qualifying ${args.qualifyingDrawSize} (${qualRounds} rounds)`;

  const pdfOpts = {
    header: {
      layout: args.headerLayout,
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
      subtitle: label,
    },
    footer: { layout: 'standard' as const, showPageNumbers: true, showTimestamp: true },
    preset: args.preset,
  };

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>${label}</h2>
    <p>Main draw: ${args.drawSize} | Qualifying: ${args.qualifyingDrawSize} players, ${args.qualifyingPositions} qualifiers</p>
    <p>Seeds: ${args.seedsCount} | Completed: ${args.completeAllMatchUps} | Preset: ${args.preset}</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => {
    generateTraditionalDrawPDF(drawData, pdfOpts).save(
      `qualifying-${args.qualifyingDrawSize}-to-${args.qualifyingPositions}.pdf`,
    );
  });
  addButton(container, 'Preview in New Tab', '#2d8a4e', () => {
    window.open(URL.createObjectURL(generateTraditionalDrawPDF(drawData, pdfOpts).output('blob')));
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

const meta: Meta<QualifyingDrawArgs> = {
  title: 'PDF/Qualifying Draw',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [16, 32, 64, 128] },
    qualifyingDrawSize: { control: { type: 'number', min: 4, max: 128 } },
    qualifyingPositions: { control: { type: 'number', min: 1, max: 32 } },
    seedsCount: { control: { type: 'range', min: 0, max: 16, step: 1 } },
    preset: { control: { type: 'select' }, options: Object.keys(PRESETS) },
    headerLayout: { control: { type: 'select' }, options: [GRAND_SLAM, 'itf', 'minimal', 'none'] },
    completeAllMatchUps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<QualifyingDrawArgs>;

// 16 players, 2 qualifiers, 3 rounds
export const Q16To2: Story = {
  name: 'Qualifying 16 (3 rounds)',
  args: {
    drawSize: 32,
    qualifyingDrawSize: 16,
    qualifyingPositions: 2,
    seedsCount: 4,
    preset: 'wimbledon',
    headerLayout: 'itf',
    completeAllMatchUps: true,
  },
};

// 16 players, 4 qualifiers, 2 rounds
export const Q16To4: Story = {
  name: 'Qualifying 16 (2 rounds)',
  args: {
    drawSize: 32,
    qualifyingDrawSize: 16,
    qualifyingPositions: 4,
    seedsCount: 4,
    preset: 'rolandGarros',
    headerLayout: GRAND_SLAM,
    completeAllMatchUps: true,
  },
};

// 32 players, 8 qualifiers, 2 rounds
export const Q32To8: Story = {
  name: 'Qualifying 32 (2 rounds)',
  args: {
    drawSize: 64,
    qualifyingDrawSize: 32,
    qualifyingPositions: 8,
    seedsCount: 8,
    preset: 'australianOpen',
    headerLayout: GRAND_SLAM,
    completeAllMatchUps: false,
  },
};

// 18 players, 6 qualifiers, 2 rounds (non-power-of-2, padded to 24)
export const Q18To6: Story = {
  name: 'Qualifying 18 (2 rounds)',
  args: {
    drawSize: 64,
    qualifyingDrawSize: 18,
    qualifyingPositions: 6,
    seedsCount: 6,
    preset: 'usOpen',
    headerLayout: 'itf',
    completeAllMatchUps: true,
  },
};

// 24 players, 3 qualifiers, 3 rounds (non-power-of-2)
export const Q24To3: Story = {
  name: 'Qualifying 24 (3 rounds)',
  args: {
    drawSize: 32,
    qualifyingDrawSize: 24,
    qualifyingPositions: 3,
    seedsCount: 4,
    preset: 'wimbledon',
    headerLayout: GRAND_SLAM,
    completeAllMatchUps: true,
  },
};
