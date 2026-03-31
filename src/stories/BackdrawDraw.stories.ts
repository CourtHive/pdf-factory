import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData, findStructure } from '../core/drawsDataToDrawData';
import { generateBackdrawPDF } from '../generators/drawPDF';
import type { BackdrawData } from '../renderers/backdrawDraw';
import type { DrawData } from '../core/extractDrawData';
import { PRESETS } from '../config/formatPresets';
import type { HeaderLayout } from '../config/types';

interface BackdrawArgs {
  drawSize: number;
  seedsCount: number;
  preset: string;
  headerLayout: HeaderLayout;
  completeAllMatchUps: boolean;
}

const EMPTY_DRAW: DrawData = {
  drawName: '',
  drawSize: 0,
  drawType: '',
  totalRounds: 0,
  slots: [],
  matchUps: [],
  seedAssignments: [],
};

function createStory(args: BackdrawArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [
      {
        drawSize: args.drawSize,
        drawType: 'FIRST_ROUND_LOSER_CONSOLATION',
        eventName: 'Backdraw Singles',
        seedsCount: args.seedsCount,
        drawId,
      },
    ],
    completeAllMatchUps: args.completeAllMatchUps,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate FRLC draw</p>';
    return container;
  }

  const { eventData } = tournamentEngine.getEventData({ drawId }) as any;
  const mainStruct = findStructure(eventData?.drawsData || [], 'MAIN');
  const consolStruct = findStructure(eventData?.drawsData || [], 'CONSOLATION');

  const data: BackdrawData = {
    mainDraw: mainStruct ? structureToDrawData(mainStruct) : EMPTY_DRAW,
    consolation: consolStruct ? structureToDrawData(consolStruct) : EMPTY_DRAW,
  };

  const info: any = tournamentEngine.getTournamentInfo();
  const pdfOpts = {
    header: {
      layout: args.headerLayout as HeaderLayout,
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
      subtitle: `Backdraw — ${args.drawSize} Draw`,
    },
    preset: args.preset,
  };

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Backdraw (USTA Playback) — ${args.drawSize} Draw</h2>
    <p>Main progresses right, consolation (playback) progresses left. First round in center.</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => {
    generateBackdrawPDF(data, pdfOpts).save(`backdraw-${args.drawSize}.pdf`);
  });
  addButton(container, 'Preview in New Tab', '#2d8a4e', () => {
    window.open(URL.createObjectURL(generateBackdrawPDF(data, pdfOpts).output('blob')));
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

const meta: Meta<BackdrawArgs> = {
  title: 'PDF/Backdraw (USTA Playback)',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32] },
    seedsCount: { control: { type: 'range', min: 0, max: 8, step: 1 } },
    preset: { control: { type: 'select' }, options: Object.keys(PRESETS) },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'wta-tour', 'minimal', 'none'] },
    completeAllMatchUps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<BackdrawArgs>;

export const Backdraw16: Story = {
  args: { drawSize: 16, seedsCount: 4, preset: 'usta', headerLayout: 'itf', completeAllMatchUps: true },
};
export const Backdraw32: Story = {
  args: { drawSize: 32, seedsCount: 8, preset: 'usta', headerLayout: 'grand-slam', completeAllMatchUps: true },
};
export const Backdraw8: Story = {
  args: { drawSize: 8, seedsCount: 2, preset: 'itfJunior', headerLayout: 'minimal', completeAllMatchUps: true },
};
export const Backdraw16Incomplete: Story = {
  args: { drawSize: 16, seedsCount: 0, preset: 'itfJunior', headerLayout: 'minimal', completeAllMatchUps: false },
};
