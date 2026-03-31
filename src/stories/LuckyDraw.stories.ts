import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData, findStructure } from '../core/drawsDataToDrawData';
import { generateLuckyDrawPDF } from '../generators/drawPDF';
import { PRESETS } from '../config/formatPresets';
import type { HeaderLayout } from '../config/types';

interface LuckyDrawArgs {
  drawSize: number;
  preset: string;
  headerLayout: HeaderLayout;
  completeAllMatchUps: boolean;
}

function createStory(args: LuckyDrawArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: args.drawSize, eventName: 'Lucky Draw', seedsCount: 0, drawId }],
    completeAllMatchUps: args.completeAllMatchUps,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate lucky draw</p>';
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
      subtitle: 'Lucky Draw',
    },
    preset: args.preset,
  };

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Lucky Draw - ${args.drawSize} Players</h2>
    <p>Preset: ${args.preset} | Completed: ${args.completeAllMatchUps}</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => {
    generateLuckyDrawPDF(drawData, pdfOpts).save(`lucky-draw-${args.drawSize}.pdf`);
  });
  addButton(container, 'Preview in New Tab', '#2d8a4e', () => {
    window.open(URL.createObjectURL(generateLuckyDrawPDF(drawData, pdfOpts).output('blob')));
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

const meta: Meta<LuckyDrawArgs> = {
  title: 'PDF/Lucky Draw',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32] },
    preset: { control: { type: 'select' }, options: Object.keys(PRESETS) },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'minimal', 'none'] },
    completeAllMatchUps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<LuckyDrawArgs>;

export const LuckyDraw16: Story = {
  args: { drawSize: 16, preset: 'itfJunior', headerLayout: 'minimal', completeAllMatchUps: true },
};
export const LuckyDraw8: Story = {
  args: { drawSize: 8, preset: 'itfJunior', headerLayout: 'minimal', completeAllMatchUps: true },
};
export const LuckyDraw32: Story = {
  args: { drawSize: 32, preset: 'usta', headerLayout: 'itf', completeAllMatchUps: false },
};
