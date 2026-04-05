import type { Meta, StoryObj } from '@storybook/html';
import { generateCourtCardPDF } from '../generators/courtCard';
import type { CourtCardData } from '../core/extractCourtCardData';

const MAIN_VENUE = 'Main Venue';
const MENS_SINGLES = 'Mens Singles';
const QUARTER_FINAL = 'Quarter-Final';
const OUTER_COURTS = 'Outer Courts';

interface CourtCardArgs {
  courtsCount: number;
}

const COURT_CARDS: CourtCardData[] = [
  {
    courtName: 'Center Court',
    venueName: MAIN_VENUE,
    currentMatch: {
      eventName: MENS_SINGLES,
      roundName: 'Semi-Final',
      side1: { name: 'SINNER, Jannik', nationality: 'ITA' },
      side2: { name: 'ALCARAZ, Carlos', nationality: 'ESP' },
    },
    nextMatch: {
      eventName: 'Womens Singles',
      roundName: 'Semi-Final',
      scheduledTime: '3:00 PM',
      side1: { name: 'SABALENKA, Aryna', nationality: 'BLR' },
      side2: { name: 'GAUFF, Coco', nationality: 'USA' },
    },
  },
  {
    courtName: 'Court 1',
    venueName: MAIN_VENUE,
    currentMatch: {
      eventName: 'Mens Doubles',
      roundName: QUARTER_FINAL,
      side1: { name: 'BOLELLI / VAVASSORI', nationality: 'ITA' },
      side2: { name: 'AREVALO / PAVIC', nationality: 'ESA/CRO' },
    },
  },
  {
    courtName: 'Court 2',
    venueName: MAIN_VENUE,
    currentMatch: {
      eventName: 'Womens Singles',
      roundName: QUARTER_FINAL,
      side1: { name: 'SWIATEK, Iga', nationality: 'POL' },
      side2: { name: 'RYBAKINA, Elena', nationality: 'KAZ' },
    },
    nextMatch: {
      eventName: MENS_SINGLES,
      roundName: QUARTER_FINAL,
      scheduledTime: '4:30 PM',
      side1: { name: 'FRITZ, Taylor', nationality: 'USA' },
      side2: { name: 'SHELTON, Ben', nationality: 'USA' },
    },
  },
  {
    courtName: 'Court 3',
    venueName: MAIN_VENUE,
    currentMatch: {
      eventName: MENS_SINGLES,
      roundName: QUARTER_FINAL,
      side1: { name: 'DJOKOVIC, Novak', nationality: 'SRB' },
      side2: { name: 'MEDVEDEV, Daniil', nationality: 'RUS' },
    },
  },
  {
    courtName: 'Court 4',
    venueName: OUTER_COURTS,
    currentMatch: {
      eventName: 'Womens Doubles',
      roundName: 'Round of 16',
      side1: { name: 'HSIEH / MERTENS', nationality: 'TPE/BEL' },
      side2: { name: 'KREJCIKOVA / SINIAKOVA', nationality: 'CZE' },
    },
  },
  {
    courtName: 'Court 5',
    venueName: OUTER_COURTS,
    currentMatch: {
      eventName: 'Mixed Doubles',
      roundName: QUARTER_FINAL,
      side1: { name: 'SIEGEMUND / KRAWIETZ', nationality: 'GER' },
      side2: { name: 'DABROWSKI / PAVIC', nationality: 'CAN/CRO' },
    },
    nextMatch: {
      eventName: 'Mens Doubles',
      roundName: 'Round of 16',
      scheduledTime: '5:00 PM',
      side1: { name: 'GRANOLLERS / ZEBALLOS', nationality: 'ESP/ARG' },
      side2: { name: 'RAM / SALISBURY', nationality: 'USA/GBR' },
    },
  },
  {
    courtName: 'Court 6',
    venueName: OUTER_COURTS,
    currentMatch: {
      eventName: 'Boys Singles',
      roundName: 'Round of 32',
      side1: { name: 'ZHANG, Jerry', nationality: 'USA' },
      side2: { name: 'OKAMURA, Rei', nationality: 'JPN' },
    },
  },
  {
    courtName: 'Court 7',
    venueName: OUTER_COURTS,
    currentMatch: {
      eventName: 'Girls Singles',
      roundName: 'Round of 32',
      side1: { name: 'MARTINEZ, Sofia', nationality: 'ARG' },
      side2: { name: 'CHEN, Xinyi', nationality: 'CHN' },
    },
  },
];

function createCourtCardStory(args: CourtCardArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const cards = COURT_CARDS.slice(0, args.courtsCount);

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Court Cards - ${cards.length} courts</h2>`;
  container.appendChild(infoDiv);

  const btn = document.createElement('button');
  btn.textContent = 'Download PDF';
  btn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #1e3c78; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
  btn.onclick = () => {
    const doc = generateCourtCardPDF(cards, { tournamentName: 'Open Championship 2026' });
    doc.save('court-cards.pdf');
  };
  container.appendChild(btn);

  const previewBtn = document.createElement('button');
  previewBtn.textContent = 'Preview in New Tab';
  previewBtn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #2d8a4e; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
  previewBtn.onclick = () => {
    const doc = generateCourtCardPDF(cards, { tournamentName: 'Open Championship 2026' });
    window.open(URL.createObjectURL(doc.output('blob')));
  };
  container.appendChild(previewBtn);

  return container;
}

const meta: Meta<CourtCardArgs> = {
  title: 'PDF/Court Cards',
  render: createCourtCardStory,
  argTypes: {
    courtsCount: { control: { type: 'range', min: 1, max: 8, step: 1 } },
  },
};

export default meta;
type Story = StoryObj<CourtCardArgs>;

export const FourCourts: Story = {
  args: { courtsCount: 4 },
};

export const EightCourts: Story = {
  args: { courtsCount: 8 },
};
