import type { Meta, StoryObj } from '@storybook/html';
import { generateMatchCardPDF, type MatchCardData } from '../generators/matchCard';

interface MatchCardArgs {
  cardsPerPage: number;
  includeScoreBoxes: boolean;
}

const SAMPLE_MATCHES: MatchCardData[] = [
  {
    tournamentName: 'Australian Open 2026',
    eventName: 'Mens Singles',
    roundName: 'Semi-Final',
    courtName: 'Rod Laver Arena',
    scheduledTime: '2:00 PM',
    side1: { name: 'SINNER, Jannik', nationality: 'ITA', seedValue: 1 },
    side2: { name: 'ALCARAZ, Carlos', nationality: 'ESP', seedValue: 2 },
  },
  {
    tournamentName: 'Australian Open 2026',
    eventName: 'Womens Singles',
    roundName: 'Semi-Final',
    courtName: 'Rod Laver Arena',
    scheduledTime: '7:00 PM',
    side1: { name: 'SABALENKA, Aryna', nationality: 'BLR', seedValue: 1 },
    side2: { name: 'GAUFF, Coco', nationality: 'USA', seedValue: 3 },
  },
  {
    tournamentName: 'Australian Open 2026',
    eventName: 'Mens Singles',
    roundName: 'Semi-Final',
    courtName: 'Margaret Court Arena',
    scheduledTime: '2:00 PM',
    side1: { name: 'DJOKOVIC, Novak', nationality: 'SRB', seedValue: 3 },
    side2: { name: 'ZVEREV, Alexander', nationality: 'GER', seedValue: 4 },
  },
  {
    tournamentName: 'Australian Open 2026',
    eventName: 'Womens Singles',
    roundName: 'Semi-Final',
    courtName: 'Margaret Court Arena',
    scheduledTime: '7:00 PM',
    side1: { name: 'SWIATEK, Iga', nationality: 'POL', seedValue: 2 },
    side2: { name: 'RYBAKINA, Elena', nationality: 'KAZ', seedValue: 4 },
  },
];

function createStory(args: MatchCardArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const buildPdf = () =>
    generateMatchCardPDF(SAMPLE_MATCHES, {
      cardsPerPage: args.cardsPerPage,
      includeScoreBoxes: args.includeScoreBoxes,
    });

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Match Cards — ${SAMPLE_MATCHES.length} Matches</h2>
    <p>${args.cardsPerPage} per page | Score boxes: ${args.includeScoreBoxes}</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => buildPdf().save('match-cards.pdf'));
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

const meta: Meta<MatchCardArgs> = {
  title: 'PDF/Match Cards',
  render: createStory,
  argTypes: {
    cardsPerPage: { control: { type: 'select' }, options: [1, 2] },
    includeScoreBoxes: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<MatchCardArgs>;

export const TwoPerPage: Story = { args: { cardsPerPage: 2, includeScoreBoxes: true } };
export const OnePerPage: Story = { args: { cardsPerPage: 1, includeScoreBoxes: true } };
export const NoScoreBoxes: Story = { args: { cardsPerPage: 2, includeScoreBoxes: false } };
