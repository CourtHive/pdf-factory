import type { Meta, StoryObj } from '@storybook/html';
import { generateSequentialOOP } from '../generators/sequentialOOP';
import type { ScheduleData, ScheduleMatch } from '../core/extractScheduleData';
import type { HeaderLayout } from '../config/types';

interface SequentialOOPArgs {
  courtsCount: number;
  matchesPerCourt: number;
  headerLayout: HeaderLayout;
}

const PLAYERS: [string, string][] = [
  ['SINNER, Jannik', 'ITA'],
  ['ALCARAZ, Carlos', 'ESP'],
  ['DJOKOVIC, Novak', 'SRB'],
  ['MEDVEDEV, Daniil', 'RUS'],
  ['ZVEREV, Alexander', 'GER'],
  ['RUNE, Holger', 'DEN'],
  ['SABALENKA, Aryna', 'BLR'],
  ['GAUFF, Coco', 'USA'],
  ['SWIATEK, Iga', 'POL'],
  ['RYBAKINA, Elena', 'KAZ'],
  ['FRITZ, Taylor', 'USA'],
  ['RUUD, Casper', 'NOR'],
  ['PEGULA, Jessica', 'USA'],
  ['ZHENG, Qinwen', 'CHN'],
  ['KEYS, Madison', 'USA'],
  ['PAOLINI, Jasmine', 'ITA'],
  ['TSITSIPAS, Stefanos', 'GRE'],
  ['SHELTON, Ben', 'USA'],
  ['DRAPER, Jack', 'GBR'],
  ['DE MINAUR, Alex', 'AUS'],
];

function generateData(courtsCount: number, matchesPerCourt: number): ScheduleData {
  const courts = Array.from({ length: courtsCount }, (_, i) => {
    if (i === 0) return 'Center Court';
    return `Court ${i}`;
  });
  const events = ['Mens Singles', 'Womens Singles', 'Mens Doubles'];
  const rounds = ['R32', 'R16', 'QF'];
  const times = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'];
  let pIdx = 0;

  const allMatches: ScheduleMatch[] = [];
  for (const court of courts) {
    for (let m = 0; m < matchesPerCourt; m++) {
      const p1 = PLAYERS[pIdx % PLAYERS.length];
      const p2 = PLAYERS[(pIdx + 1) % PLAYERS.length];
      pIdx += 2;
      const completed = m === 0;
      allMatches.push({
        courtName: court,
        scheduledTime: m === 0 ? times[0] : '',
        notBeforeTime: m >= 2 ? times[m] : undefined,
        eventName: events[m % events.length],
        eventAbbr: events[m % events.length]
          .split(' ')
          .map((w) => w[0])
          .join(''),
        roundName: rounds[m % rounds.length],
        side1: { name: p1[0], nationality: p1[1] },
        side2: { name: p2[0], nationality: p2[1] },
        score: completed ? '6-4 6-3' : undefined,
        matchUpStatus: completed ? 'COMPLETED' : 'TO_BE_PLAYED',
      });
    }
  }

  return {
    scheduledDate: '2026-03-29',
    courts,
    timeSlots: [{ time: '10:00', label: '10:00 AM', matches: allMatches }],
  };
}

function createStory(args: SequentialOOPArgs): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const data = generateData(args.courtsCount, args.matchesPerCourt);

  const buildPdf = () =>
    generateSequentialOOP(data, {
      header: {
        layout: args.headerLayout,
        tournamentName: 'Australian Open 2026',
        subtitle: 'ORDER OF PLAY — Day 5',
        startDate: '23 Jan 2026',
        location: 'Melbourne, Australia',
      },
      officials: [
        { role: 'Tournament Director', name: 'Craig Tiley' },
        { role: 'Supervisor', name: 'Wayne McEwen' },
      ],
      disclaimer: 'All times are local. Matches may be moved at the discretion of the Supervisor.',
    });

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `<h2>Sequential OOP — ${args.courtsCount} Courts</h2>
    <p>WTA/Grand Slam vertical format: courts stacked, matches in sequence</p>`;
  container.appendChild(infoDiv);

  addButton(container, 'Download PDF', '#1e3c78', () => buildPdf().save('sequential-oop.pdf'));
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

const meta: Meta<SequentialOOPArgs> = {
  title: 'PDF/Sequential OOP',
  render: createStory,
  argTypes: {
    courtsCount: { control: { type: 'range', min: 2, max: 8, step: 1 } },
    matchesPerCourt: { control: { type: 'range', min: 1, max: 4, step: 1 } },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'wta-tour', 'minimal', 'none'] },
  },
};

export default meta;
type Story = StoryObj<SequentialOOPArgs>;

export const GrandSlamDay: Story = { args: { courtsCount: 4, matchesPerCourt: 3, headerLayout: 'grand-slam' } };
export const SmallVenue: Story = { args: { courtsCount: 2, matchesPerCourt: 2, headerLayout: 'itf' } };
