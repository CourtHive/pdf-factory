import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { generateDoubleEliminationPDF } from '../generators/drawPDF';
import type { DoubleEliminationData } from '../renderers/doubleEliminationDraw';
import type { DrawData } from '../core/extractDrawData';
import { structureToDrawData, findStructure } from '../core/drawsDataToDrawData';
import { PRESETS } from '../config/formatPresets';
import type { HeaderLayout } from '../config/types';

interface DoubleEliminationArgs {
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

function extractFromDrawsData(drawsData: any[]): DoubleEliminationData {
  return {
    winnersBracket: findStructure(drawsData, 'MAIN')
      ? structureToDrawData(findStructure(drawsData, 'MAIN'))
      : EMPTY_DRAW,
    losersBracket: findStructure(drawsData, 'CONSOLATION')
      ? structureToDrawData(findStructure(drawsData, 'CONSOLATION'))
      : EMPTY_DRAW,
    deciderMatch: findStructure(drawsData, 'PLAY_OFF')
      ? structureToDrawData(findStructure(drawsData, 'PLAY_OFF'))
      : undefined,
  };
}

function createStory(args: DoubleEliminationArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [
      {
        drawSize: args.drawSize,
        drawType: 'DOUBLE_ELIMINATION',
        eventName: 'Double Elimination',
        seedsCount: args.seedsCount,
        randomWinningSide: true,
        drawId,
      },
    ],
    completeAllMatchUps: args.completeAllMatchUps,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate double elimination draw</p>';
    return container;
  }

  // Complete any cross-structure matchUps left by mocksEngine
  if (args.completeAllMatchUps) {
    let remaining = true;
    let passes = 0;
    while (remaining && passes < 5) {
      passes++;
      remaining = false;
      const { matchUps: allMu } = tournamentEngine.allTournamentMatchUps();
      const ready = allMu.filter((m: any) => m.readyToScore && m.matchUpStatus === 'TO_BE_PLAYED');
      for (const mu of ready) {
        const outcome = mocksEngine.generateOutcome({ matchUpFormat: mu.matchUpFormat });
        if (outcome?.outcome) {
          const r = tournamentEngine.setMatchUpStatus({
            matchUpId: mu.matchUpId,
            drawId: mu.drawId,
            outcome: outcome.outcome,
          });
          if (r?.success) remaining = true;
        }
      }
    }
  }

  const { eventData } = tournamentEngine.getEventData({ drawId });
  const data = extractFromDrawsData(eventData?.drawsData || []);
  const info: any = tournamentEngine.getTournamentInfo();

  const pdfOpts = {
    header: {
      layout: args.headerLayout,
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
      subtitle: `Double Elimination - ${args.drawSize} Players`,
    },
    preset: args.preset,
  };

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Double Elimination - ${args.drawSize} Players</h2>
    <p>Preset: ${args.preset} | Completed: ${args.completeAllMatchUps}</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => {
    generateDoubleEliminationPDF(data, pdfOpts).save(`double-elim-${args.drawSize}.pdf`);
  });
  addButton(container, 'Preview in New Tab', '#2d8a4e', () => {
    window.open(URL.createObjectURL(generateDoubleEliminationPDF(data, pdfOpts).output('blob')));
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

const meta: Meta<DoubleEliminationArgs> = {
  title: 'PDF/Double Elimination',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32] },
    seedsCount: { control: { type: 'range', min: 0, max: 8, step: 1 } },
    preset: { control: { type: 'select' }, options: Object.keys(PRESETS) },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'minimal', 'none'] },
    completeAllMatchUps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DoubleEliminationArgs>;

export const DoubleElim8: Story = {
  args: { drawSize: 8, seedsCount: 2, preset: 'usta', headerLayout: 'itf', completeAllMatchUps: true },
};
export const DoubleElim16: Story = {
  args: { drawSize: 16, seedsCount: 4, preset: 'usta', headerLayout: 'itf', completeAllMatchUps: true },
};
export const DoubleElim8Incomplete: Story = {
  args: { drawSize: 8, seedsCount: 0, preset: 'itfJunior', headerLayout: 'minimal', completeAllMatchUps: false },
};
