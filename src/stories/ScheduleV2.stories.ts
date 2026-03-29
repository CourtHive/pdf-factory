import type { Meta, StoryObj } from '@storybook/html';
import { generateScheduleV2PDF } from '../generators/scheduleV2';
import type { ScheduleData, ScheduleMatch } from '../core/extractScheduleData';
import type { HeaderLayout } from '../config/types';

interface ScheduleV2Args {
  courtsCount: number;
  matchesPerSlot: number;
  headerLayout: HeaderLayout;
  orientation: 'auto' | 'landscape' | 'portrait';
  cellStyle: 'detailed' | 'compact';
  showAlertBanner: boolean;
}

const PLAYERS = [
  ['SINNER, Jannik', 'ITA'],
  ['ALCARAZ, Carlos', 'ESP'],
  ['DJOKOVIC, Novak', 'SRB'],
  ['MEDVEDEV, Daniil', 'RUS'],
  ['ZVEREV, Alexander', 'GER'],
  ['RUNE, Holger', 'DEN'],
  ['RUUD, Casper', 'NOR'],
  ['FRITZ, Taylor', 'USA'],
  ['SABALENKA, Aryna', 'BLR'],
  ['GAUFF, Coco', 'USA'],
  ['SWIATEK, Iga', 'POL'],
  ['RYBAKINA, Elena', 'KAZ'],
  ['PEGULA, Jessica', 'USA'],
  ['ZHENG, Qinwen', 'CHN'],
  ['KEYS, Madison', 'USA'],
  ['PAOLINI, Jasmine', 'ITA'],
  ['TSITSIPAS, Stefanos', 'GRE'],
  ['SHELTON, Ben', 'USA'],
  ['DRAPER, Jack', 'GBR'],
  ['DE MINAUR, Alex', 'AUS'],
];

function generateScheduleData(courtsCount: number, matchesPerSlot: number): ScheduleData {
  const courts = Array.from({ length: courtsCount }, (_, i) => (i === 0 ? 'Center Court' : `Court ${i}`));
  const timeSlots = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'];
  const events = ['Mens Singles', 'Womens Singles', 'Mens Doubles'];
  const rounds = ['R32', 'R16', 'QF', 'SF'];
  let playerIdx = 0;

  return {
    scheduledDate: '2026-03-29',
    courts,
    timeSlots: timeSlots.slice(0, matchesPerSlot).map((time, slotIdx) => ({
      time: time.replace(/[^0-9:]/g, ''),
      label: time,
      matches: courts.map((court) => {
        const p1 = PLAYERS[playerIdx % PLAYERS.length];
        const p2 = PLAYERS[(playerIdx + 1) % PLAYERS.length];
        playerIdx += 2;
        const completed = slotIdx === 0;
        const match: ScheduleMatch = {
          courtName: court,
          scheduledTime: time,
          eventName: events[slotIdx % events.length],
          eventAbbr: events[slotIdx % events.length]
            .split(' ')
            .map((w) => w[0])
            .join(''),
          roundName: rounds[slotIdx % rounds.length],
          side1: { name: p1[0], nationality: p1[1] },
          side2: { name: p2[0], nationality: p2[1] },
          score: completed ? '6-4 6-3' : undefined,
          matchUpStatus: completed ? 'COMPLETED' : 'TO_BE_PLAYED',
        };
        return match;
      }),
    })),
  };
}

function createStory(args: ScheduleV2Args): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const scheduleData = generateScheduleData(args.courtsCount, args.matchesPerSlot);

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `
    <h2>Order of Play - ${args.courtsCount} Courts</h2>
    <p>Orientation: ${args.orientation} | Style: ${args.cellStyle} | Header: ${args.headerLayout}</p>
  `;
  container.appendChild(infoDiv);

  const btn = document.createElement('button');
  btn.textContent = 'Download PDF';
  btn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #1e3c78; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
  btn.onclick = () => {
    const doc = generateScheduleV2PDF(scheduleData, {
      header: {
        layout: args.headerLayout,
        tournamentName: 'Open Championship',
        subtitle: 'ORDER OF PLAY - Day 1',
        startDate: '29 Mar 2026',
        location: 'Melbourne, Australia',
      },
      page: { orientation: args.orientation },
      cellStyle: args.cellStyle,
      alertBanner: args.showAlertBanner ? 'PLAY STARTS AT 11:00 AM ON ALL COURTS' : undefined,
      notes: ['All times are local.', 'Matches may be moved to any court.'],
      officials: [
        { role: 'Tournament Director', name: 'Craig Tiley' },
        { role: 'Supervisor', name: 'Wayne McEwen' },
      ],
    });
    doc.save(`order-of-play-${args.courtsCount}-courts.pdf`);
  };
  container.appendChild(btn);

  const previewBtn = document.createElement('button');
  previewBtn.textContent = 'Preview';
  previewBtn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #2d8a4e; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
  previewBtn.onclick = () => {
    const doc = generateScheduleV2PDF(scheduleData, {
      header: { layout: args.headerLayout, tournamentName: 'Open Championship', subtitle: 'ORDER OF PLAY - Day 1' },
      page: { orientation: args.orientation },
      cellStyle: args.cellStyle,
      alertBanner: args.showAlertBanner ? 'PLAY STARTS AT 11:00 AM' : undefined,
    });
    window.open(URL.createObjectURL(doc.output('blob')));
  };
  container.appendChild(previewBtn);

  return container;
}

const meta: Meta<ScheduleV2Args> = {
  title: 'PDF/Order of Play',
  render: createStory,
  argTypes: {
    courtsCount: { control: { type: 'range', min: 2, max: 12, step: 1 } },
    matchesPerSlot: { control: { type: 'range', min: 1, max: 4, step: 1 } },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'minimal', 'none'] },
    orientation: { control: { type: 'select' }, options: ['auto', 'landscape', 'portrait'] },
    cellStyle: { control: { type: 'select' }, options: ['detailed', 'compact'] },
    showAlertBanner: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<ScheduleV2Args>;

export const FiveCourts: Story = {
  args: {
    courtsCount: 5,
    matchesPerSlot: 3,
    headerLayout: 'itf',
    orientation: 'auto',
    cellStyle: 'detailed',
    showAlertBanner: false,
  },
};

export const GrandSlam: Story = {
  args: {
    courtsCount: 8,
    matchesPerSlot: 4,
    headerLayout: 'grand-slam',
    orientation: 'landscape',
    cellStyle: 'compact',
    showAlertBanner: true,
  },
};

export const SmallVenue: Story = {
  args: {
    courtsCount: 3,
    matchesPerSlot: 2,
    headerLayout: 'minimal',
    orientation: 'portrait',
    cellStyle: 'detailed',
    showAlertBanner: false,
  },
};
