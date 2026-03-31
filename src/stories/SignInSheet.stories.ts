import type { Meta, StoryObj } from '@storybook/html';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import { generateSignInSheetPDF } from '../generators/signInSheet';
import type { ParticipantRow } from '../core/extractParticipantData';

interface SignInSheetArgs {
  drawSize: number;
  eventName: string;
  signInDate: string;
}

function createStory(args: SignInSheetArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const result: any = mocksEngine.generateTournamentRecord({
    drawProfiles: [{ drawSize: args.drawSize, eventName: args.eventName, seedsCount: Math.min(8, args.drawSize / 2) }],
    setState: true,
  });

  if (!result.success) {
    container.innerHTML = '<p style="color:red">Failed to generate tournament</p>';
    return container;
  }

  const participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });
  const info: any = tournamentEngine.getTournamentInfo();

  const players: ParticipantRow[] = (participants.participants || []).map((p: any, i: number) => ({
    name: p.participantName,
    nationality: p.person?.nationalityCode || '',
    ranking: ((i * 13 + 7) % 200) + 1, // deterministic pseudo-ranking
    seedValue: i < Math.min(8, args.drawSize / 2) ? i + 1 : undefined,
    entryStatus: i === 0 ? 'WC' : '',
    events: [args.eventName],
  }));

  const buildPdf = () =>
    generateSignInSheetPDF(players, {
      header: { tournamentName: info.tournamentInfo?.tournamentName || 'Tournament' },
      eventName: args.eventName,
      signInDate: args.signInDate,
      signInTime: '9:00 AM',
    });

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Sign-In Sheet — ${args.drawSize} Players</h2><p>${args.eventName} | ${args.signInDate}</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => buildPdf().save('sign-in-sheet.pdf'));
  addButton(container, 'Preview in New Tab', '#2d8a4e', () =>
    window.open(URL.createObjectURL(buildPdf().output('blob'))),
  );

  return container;
}

function addButton(container: HTMLElement, label: string, color: string, onclick: () => void) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = `padding: 10px 24px; cursor: pointer; background: ${color}; color: white; border: none; border-radius: 4px; margin: 8px 4px;`;
  btn.onclick = onclick;
  container.appendChild(btn);
}

const meta: Meta<SignInSheetArgs> = {
  title: 'PDF/Sign-In Sheet',
  render: createStory,
  argTypes: {
    drawSize: { control: { type: 'select' }, options: [8, 16, 32, 64] },
    eventName: { control: 'text' },
    signInDate: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<SignInSheetArgs>;

export const Default: Story = { args: { drawSize: 32, eventName: 'Singles', signInDate: '29 Mar 2026' } };
export const SmallDraw: Story = { args: { drawSize: 8, eventName: 'Doubles', signInDate: '30 Mar 2026' } };
