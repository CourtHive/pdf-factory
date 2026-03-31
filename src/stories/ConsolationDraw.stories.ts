import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { structureToDrawData } from '../core/drawsDataToDrawData';
import type { ConsolationStructure } from '../renderers/consolationDraw';
import { generateConsolationDrawPDF } from '../generators/drawPDF';
import { PRESETS } from '../config/formatPresets';
import type { HeaderLayout } from '../config/types';

interface ConsolationDrawArgs {
  drawSize: number;
  seedsCount: number;
  drawType: string;
  preset: string;
  headerLayout: HeaderLayout;
  completeAllMatchUps: boolean;
}

function createStory(args: ConsolationDrawArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [
      {
        drawSize: args.drawSize,
        drawType: args.drawType,
        eventName: 'Consolation Singles',
        seedsCount: args.seedsCount,
        drawId,
      },
    ],
    completeAllMatchUps: args.completeAllMatchUps,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate consolation draw</p>';
    return container;
  }

  const { eventData } = tournamentEngine.getEventData({ drawId }) as any;
  const structures: ConsolationStructure[] = (eventData?.drawsData?.[0]?.structures || []).map((s: any) => ({
    name: s.structureName,
    stage: s.stage,
    drawData: structureToDrawData(s),
  }));
  const info: any = tournamentEngine.getTournamentInfo();

  const pdfOpts = {
    header: {
      layout: args.headerLayout as HeaderLayout,
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
      subtitle: `${args.drawType.replace(/_/g, ' ')} - ${args.drawSize} Draw`,
    },
    preset: args.preset,
  };

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Consolation Draw - ${args.drawSize} Players</h2>
    <p>Type: ${args.drawType} | Structures: ${structures.length} | Preset: ${args.preset}</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => {
    generateConsolationDrawPDF(structures, pdfOpts).save(`consolation-${args.drawSize}.pdf`);
  });
  addButton(container, 'Preview in New Tab', '#2d8a4e', () => {
    window.open(URL.createObjectURL(generateConsolationDrawPDF(structures, pdfOpts).output('blob')));
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

const meta: Meta<ConsolationDrawArgs> = {
  title: 'PDF/Consolation Draw',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32, 64] },
    seedsCount: { control: { type: 'range', min: 0, max: 16, step: 1 } },
    drawType: {
      control: { type: 'select' },
      options: ['FIRST_MATCH_LOSER_CONSOLATION', 'FIRST_ROUND_LOSER_CONSOLATION', 'FEED_IN_CHAMPIONSHIP'],
    },
    preset: { control: { type: 'select' }, options: Object.keys(PRESETS) },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'minimal', 'none'] },
    completeAllMatchUps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<ConsolationDrawArgs>;

export const FirstMatchLoser16: Story = {
  args: {
    drawSize: 16,
    seedsCount: 4,
    drawType: 'FIRST_MATCH_LOSER_CONSOLATION',
    preset: 'itfJunior',
    headerLayout: 'itf',
    completeAllMatchUps: true,
  },
};
export const FeedInChampionship32: Story = {
  args: {
    drawSize: 32,
    seedsCount: 8,
    drawType: 'FEED_IN_CHAMPIONSHIP',
    preset: 'usta',
    headerLayout: 'itf',
    completeAllMatchUps: true,
  },
};
export const Consolation32Incomplete: Story = {
  args: {
    drawSize: 32,
    seedsCount: 4,
    drawType: 'FIRST_MATCH_LOSER_CONSOLATION',
    preset: 'itfJunior',
    headerLayout: 'minimal',
    completeAllMatchUps: false,
  },
};
