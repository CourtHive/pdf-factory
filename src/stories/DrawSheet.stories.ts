import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractDrawData } from '../core/extractDrawData';
import { generateDrawSheetPDF } from '../generators/drawSheet';

interface DrawSheetArgs {
  drawSize: number;
  seedsCount: number;
  eventName: string;
  completeAllMatchUps: boolean;
}

function createDrawSheetStory(args: DrawSheetArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: args.drawSize, eventName: args.eventName, seedsCount: args.seedsCount }],
    completeAllMatchUps: args.completeAllMatchUps,
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament</p>';
    return container;
  }

  const info: any = tournamentEngine.getTournamentInfo();
  const events: any = tournamentEngine.getEvents();
  const drawDefinition = events.events?.[0]?.drawDefinitions?.[0];
  const participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });

  const drawData = extractDrawData({ drawDefinition, participants: participants.participants || [] });

  // Info section
  const infoDiv = document.createElement('div');
  infoDiv.style.marginBottom = '16px';
  infoDiv.innerHTML = `
    <h2>${args.eventName} - ${args.drawSize} Draw</h2>
    <p>Seeds: ${args.seedsCount} | Matches completed: ${args.completeAllMatchUps ? 'Yes' : 'No'}</p>
    <p>Participants: ${drawData.slots.filter((s) => !s.isBye).length} | Byes: ${drawData.slots.filter((s) => s.isBye).length}</p>
  `;
  container.appendChild(infoDiv);

  // Generate button
  const btn = document.createElement('button');
  btn.textContent = 'Generate & Download PDF';
  btn.style.cssText =
    'padding: 10px 24px; font-size: 14px; cursor: pointer; background: #1e3c78; color: white; border: none; border-radius: 4px; margin-right: 10px;';
  btn.onclick = () => {
    const doc = generateDrawSheetPDF(drawData, {
      header: {
        tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
        startDate: info.tournamentInfo?.startDate,
      },
      includeSeedings: true,
      includeScores: args.completeAllMatchUps,
    });
    doc.save(`draw-${args.drawSize}.pdf`);
  };
  container.appendChild(btn);

  // Preview button
  const previewBtn = document.createElement('button');
  previewBtn.textContent = 'Preview in New Tab';
  previewBtn.style.cssText =
    'padding: 10px 24px; font-size: 14px; cursor: pointer; background: #2d8a4e; color: white; border: none; border-radius: 4px;';
  previewBtn.onclick = () => {
    const doc = generateDrawSheetPDF(drawData, {
      header: {
        tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
        startDate: info.tournamentInfo?.startDate,
      },
      includeSeedings: true,
      includeScores: args.completeAllMatchUps,
    });
    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob));
  };
  container.appendChild(previewBtn);

  // Seedings table
  if (drawData.seedAssignments.length > 0) {
    const table = document.createElement('table');
    table.style.cssText = 'margin-top: 20px; border-collapse: collapse; font-size: 13px;';
    table.innerHTML = `
      <thead><tr style="background:#eee">
        <th style="padding:6px 12px;border:1px solid #ddd">Seed</th>
        <th style="padding:6px 12px;border:1px solid #ddd">Player</th>
        <th style="padding:6px 12px;border:1px solid #ddd">Nat.</th>
      </tr></thead>
      <tbody>
        ${drawData.seedAssignments
          .map(
            (s) => `<tr>
          <td style="padding:4px 12px;border:1px solid #ddd;text-align:center">${s.seedValue}</td>
          <td style="padding:4px 12px;border:1px solid #ddd">${s.participantName}</td>
          <td style="padding:4px 12px;border:1px solid #ddd;text-align:center">${s.nationality}</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    `;
    container.appendChild(table);
  }

  return container;
}

const meta: Meta<DrawSheetArgs> = {
  title: 'PDF/Draw Sheet',
  render: createDrawSheetStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32, 64] },
    seedsCount: { control: { type: 'range', min: 0, max: 16, step: 1 } },
    eventName: { control: 'text' },
    completeAllMatchUps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DrawSheetArgs>;

export const Draw16: Story = {
  args: { drawSize: 16, seedsCount: 4, eventName: 'Boys Singles', completeAllMatchUps: true },
};

export const Draw32: Story = {
  args: { drawSize: 32, seedsCount: 8, eventName: 'Girls Singles', completeAllMatchUps: false },
};

export const Draw64: Story = {
  args: { drawSize: 64, seedsCount: 16, eventName: 'Open Singles', completeAllMatchUps: true },
};
