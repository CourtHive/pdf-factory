import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractCompassData } from '../core/extractCompassData';
import { generateCompassDrawPDF } from '../generators/drawPDF';
import { PRESETS } from '../config/formatPresets';
import type { HeaderLayout } from '../config/types';

interface CompassDrawArgs {
  drawSize: number;
  seedsCount: number;
  preset: string;
  headerLayout: HeaderLayout;
  completeAllMatchUps: boolean;
}

function createStory(args: CompassDrawArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const drawId = 'drawId';
  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [
      {
        drawSize: args.drawSize,
        drawType: 'COMPASS',
        eventName: 'Compass Singles',
        seedsCount: args.seedsCount,
        drawId,
      },
    ],
    completeAllMatchUps: args.completeAllMatchUps,
    randomWinningSide: true,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate compass draw</p>';
    return container;
  }

  // Compass uses extractCompassData which needs drawDefinition — get from events
  const events: any = tournamentEngine.getEvents();
  const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
  const participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });
  const compassData = extractCompassData({ drawDefinition, participants: participants.participants || [] });
  const info: any = tournamentEngine.getTournamentInfo();

  const pdfOpts = {
    header: {
      layout: args.headerLayout as HeaderLayout,
      tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
      subtitle: `Compass Draw - ${args.drawSize} Players`,
    },
    preset: args.preset,
  };

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Compass Draw - ${args.drawSize} Players</h2>
    <p>Preset: ${args.preset} | Structures: ${compassData.structures.length} | Completed: ${args.completeAllMatchUps}</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => {
    generateCompassDrawPDF(compassData, pdfOpts).save(`compass-${args.drawSize}-${args.preset}.pdf`);
  });
  addButton(container, 'Preview in New Tab', '#2d8a4e', () => {
    window.open(URL.createObjectURL(generateCompassDrawPDF(compassData, pdfOpts).output('blob')));
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

const meta: Meta<CompassDrawArgs> = {
  title: 'PDF/Compass Draw',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16] },
    seedsCount: { control: { type: 'range', min: 0, max: 4, step: 1 } },
    preset: { control: { type: 'select' }, options: Object.keys(PRESETS) },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'minimal', 'none'] },
    completeAllMatchUps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<CompassDrawArgs>;

export const Compass8ITF: Story = {
  args: { drawSize: 8, seedsCount: 2, preset: 'itfJunior', headerLayout: 'itf', completeAllMatchUps: true },
};
export const Compass16USTA: Story = {
  args: { drawSize: 16, seedsCount: 4, preset: 'usta', headerLayout: 'itf', completeAllMatchUps: true },
};
export const Compass8Incomplete: Story = {
  args: { drawSize: 8, seedsCount: 0, preset: 'itfJunior', headerLayout: 'minimal', completeAllMatchUps: false },
};
export const Compass16LTA: Story = {
  args: { drawSize: 16, seedsCount: 4, preset: 'lta', headerLayout: 'itf', completeAllMatchUps: true },
};
