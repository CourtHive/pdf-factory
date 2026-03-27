import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { extractParticipantData } from '../core/extractParticipantData';
import { generatePlayerListPDF } from '../generators/playerList';

interface PlayerListArgs {
  drawSize: number;
  eventName: string;
}

function createPlayerListStory(args: PlayerListArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: args.drawSize, eventName: args.eventName }],
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament</p>';
    return container;
  }

  const info: any = tournamentEngine.getTournamentInfo();
  const participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });
  const events: any = tournamentEngine.getEvents();

  const eventEntries = (events.events || []).map((e: any) => ({
    eventName: e.eventName,
    entries: e.entries || [],
  }));

  const players = extractParticipantData({ participants: participants.participants || [], eventEntries });

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Player List - ${players.length} players</h2>`;
  container.appendChild(infoDiv);

  const btn = document.createElement('button');
  btn.textContent = 'Generate & Download PDF';
  btn.style.cssText =
    'padding: 10px 24px; font-size: 14px; cursor: pointer; background: #28502e; color: white; border: none; border-radius: 4px; margin-right: 10px;';
  btn.onclick = () => {
    const doc = generatePlayerListPDF(players, {
      header: {
        tournamentName: info.tournamentInfo?.tournamentName || 'Tournament',
        startDate: info.tournamentInfo?.startDate,
      },
    });
    doc.save('player-list.pdf');
  };
  container.appendChild(btn);

  // Preview table
  const table = document.createElement('table');
  table.style.cssText = 'margin-top: 16px; border-collapse: collapse; font-size: 12px; width: 100%;';
  table.innerHTML = `
    <thead><tr style="background:#28502e;color:white">
      <th style="padding:6px;border:1px solid #ddd">#</th>
      <th style="padding:6px;border:1px solid #ddd">Name</th>
      <th style="padding:6px;border:1px solid #ddd">Nat.</th>
      <th style="padding:6px;border:1px solid #ddd">Entry</th>
      <th style="padding:6px;border:1px solid #ddd">Events</th>
    </tr></thead>
    <tbody>
      ${players
        .slice(0, 20)
        .map(
          (p, i) => `<tr style="background:${i % 2 ? '#f2f8f2' : 'white'}">
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;font-weight:bold">${p.name}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:center">${p.nationality}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:center">${p.entryStatus}</td>
        <td style="padding:4px 6px;border:1px solid #ddd">${p.events.join(', ')}</td>
      </tr>`,
        )
        .join('')}
      ${players.length > 20 ? `<tr><td colspan="5" style="padding:8px;text-align:center;color:#888">...and ${players.length - 20} more</td></tr>` : ''}
    </tbody>
  `;
  container.appendChild(table);

  return container;
}

const meta: Meta<PlayerListArgs> = {
  title: 'PDF/Player List',
  render: createPlayerListStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [16, 32, 64, 128] },
    eventName: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<PlayerListArgs>;

export const Default: Story = {
  args: { drawSize: 32, eventName: 'Singles' },
};

export const Large: Story = {
  args: { drawSize: 64, eventName: 'Open Singles' },
};
