import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData, findStructure } from '../core/drawsDataToDrawData';
import { generateMirroredDrawPDF } from '../generators/drawPDF';
import { PRESETS } from '../config/formatPresets';
import type { HeaderLayout } from '../config/types';

interface MirroredDrawArgs {
  drawSize: number;
  seedsCount: number;
  preset: string;
  headerLayout: HeaderLayout;
  completeAllMatchUps: boolean;
}

function createStory(args: MirroredDrawArgs): HTMLElement {
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
      subtitle: 'Singles — Mirrored Bracket',
    },
    preset: args.preset,
  };

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Mirrored Bracket - ${args.drawSize} Draw</h2>
    <p>NCAA-style: two halves progress inward, winner in center</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => {
    generateMirroredDrawPDF(drawData, pdfOpts).save(`mirrored-${args.drawSize}.pdf`);
  });
  addButton(container, 'Preview in New Tab', '#2d8a4e', () => {
    window.open(URL.createObjectURL(generateMirroredDrawPDF(drawData, pdfOpts).output('blob')));
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

const meta: Meta<MirroredDrawArgs> = {
  title: 'PDF/Mirrored Bracket',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32, 64] },
    seedsCount: { control: { type: 'range', min: 0, max: 16, step: 1 } },
    preset: { control: { type: 'select' }, options: Object.keys(PRESETS) },
    headerLayout: {
      control: { type: 'select' },
      options: ['grand-slam', 'itf', 'minimal', 'wta-tour', 'national-federation', 'none'],
    },
    completeAllMatchUps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<MirroredDrawArgs>;

export const NCAA16: Story = {
  args: { drawSize: 16, seedsCount: 4, preset: 'itfJunior', headerLayout: 'grand-slam', completeAllMatchUps: true },
};
export const NCAA32: Story = {
  args: { drawSize: 32, seedsCount: 8, preset: 'usta', headerLayout: 'grand-slam', completeAllMatchUps: true },
};
export const Mirrored8: Story = {
  args: { drawSize: 8, seedsCount: 2, preset: 'itfJunior', headerLayout: 'minimal', completeAllMatchUps: true },
};
export const NCAA64: Story = {
  args: { drawSize: 64, seedsCount: 16, preset: 'wimbledon', headerLayout: 'grand-slam', completeAllMatchUps: true },
};
