import type { Meta, StoryObj } from '@storybook/html';
import { generateScheduleV2PDF } from '../generators/scheduleV2';
import type { ScheduleData, ScheduleMatch } from '../core/extractScheduleData';
import type { HeaderLayout } from '../config/types';

const SCHEDULED_DATE = '2026-03-29';
const FOLLOWED_BY = 'Followed By';

interface ScheduleV2Args {
  courtsCount: number;
  schedulePattern: 'shotgun' | 'sequential' | 'mixed';
  headerLayout: HeaderLayout;
  orientation: 'auto' | 'landscape' | 'portrait';
  cellStyle: 'detailed' | 'compact';
  showAlertBanner: boolean;
}

const PLAYERS: [string, string][] = [
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

function generateScheduleData(courtsCount: number, pattern: string): ScheduleData {
  const courts = Array.from({ length: courtsCount }, (_, i) => (i === 0 ? 'Center Court' : `Court ${i}`));
  const events = ['Mens Singles', 'Womens Singles', 'Mens Doubles'];
  const rounds = ['R32', 'R16', 'QF', 'SF'];
  let playerIdx = 0;

  const makeMatch = (court: string, slotIdx: number, time: string, nbTime?: string, score?: string): ScheduleMatch => {
    const p1 = PLAYERS[playerIdx % PLAYERS.length];
    const p2 = PLAYERS[(playerIdx + 1) % PLAYERS.length];
    playerIdx += 2;
    return {
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
      score,
      matchUpStatus: score ? 'COMPLETED' : 'TO_BE_PLAYED',
      notBeforeTime: nbTime,
    };
  };

  if (pattern === 'shotgun') {
    // Shotgun start: all R1 at 8:00, R2 "Followed By", R3 "NB 10:30 AM"
    return {
      scheduledDate: SCHEDULED_DATE,
      courts,
      timeSlots: [
        {
          time: '08:00',
          label: '8:00 AM',
          matches: courts.map((court) => makeMatch(court, 0, '8:00 AM', undefined, '6-4 6-3')),
        },
        {
          time: '09:30',
          label: FOLLOWED_BY,
          matches: courts.map((court) => makeMatch(court, 1, FOLLOWED_BY)),
        },
        {
          time: '10:30',
          label: 'NB 10:30 AM',
          matches: courts.map((court) => makeMatch(court, 2, '', 'NB 10:30 AM')),
        },
      ],
    };
  }

  if (pattern === 'mixed') {
    // Mixed: some timed, some followed-by, some not-before
    return {
      scheduledDate: SCHEDULED_DATE,
      courts,
      timeSlots: [
        {
          time: '10:00',
          label: '10:00 AM',
          matches: courts.map((court) => makeMatch(court, 0, '10:00 AM', undefined, '6-4 6-3')),
        },
        {
          time: '11:30',
          label: FOLLOWED_BY,
          matches: courts.map((court) => makeMatch(court, 1, FOLLOWED_BY)),
        },
        {
          time: '14:00',
          label: 'NB 2:00 PM',
          matches: courts.map((court) => makeMatch(court, 2, '', 'NB 2:00 PM')),
        },
        {
          time: '16:00',
          label: '4:00 PM',
          matches: courts.map((court) => makeMatch(court, 3, '4:00 PM')),
        },
      ],
    };
  }

  // Sequential (default): standard timed slots
  return {
    scheduledDate: SCHEDULED_DATE,
    courts,
    timeSlots: [
      {
        time: '10:00',
        label: '10:00 AM',
        matches: courts.map((court) => makeMatch(court, 0, '10:00 AM', undefined, '6-4 6-3')),
      },
      { time: '12:00', label: '12:00 PM', matches: courts.map((court) => makeMatch(court, 1, '12:00 PM')) },
      { time: '14:00', label: '2:00 PM', matches: courts.map((court) => makeMatch(court, 2, '2:00 PM')) },
    ],
  };
}

function createStory(args: ScheduleV2Args): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; font-family: sans-serif;';

  const scheduleData = generateScheduleData(args.courtsCount, args.schedulePattern);

  const infoDiv = document.createElement('div');
  infoDiv.innerHTML = `
    <h2>Order of Play - ${args.courtsCount} Courts</h2>
    <p>Pattern: ${args.schedulePattern} | Orientation: ${args.orientation} | Style: ${args.cellStyle} | Header: ${args.headerLayout}</p>
  `;
  container.appendChild(infoDiv);

  const buildPdf = () =>
    generateScheduleV2PDF(scheduleData, {
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

  const btn = document.createElement('button');
  btn.textContent = 'Download PDF';
  btn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #1e3c78; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
  btn.onclick = () => buildPdf().save(`oop-${args.courtsCount}-courts.pdf`);
  container.appendChild(btn);

  const previewBtn = document.createElement('button');
  previewBtn.textContent = 'Preview in New Tab';
  previewBtn.style.cssText =
    'padding: 10px 24px; cursor: pointer; background: #2d8a4e; color: white; border: none; border-radius: 4px; margin: 8px 4px;';
  previewBtn.onclick = () => window.open(URL.createObjectURL(buildPdf().output('blob')));
  container.appendChild(previewBtn);

  return container;
}

const meta: Meta<ScheduleV2Args> = {
  title: 'PDF/Order of Play',
  render: createStory,
  argTypes: {
    courtsCount: { control: { type: 'range', min: 2, max: 12, step: 1 } },
    schedulePattern: { control: { type: 'select' }, options: ['shotgun', 'sequential', 'mixed'] },
    headerLayout: { control: { type: 'select' }, options: ['grand-slam', 'itf', 'minimal', 'none'] },
    orientation: { control: { type: 'select' }, options: ['auto', 'landscape', 'portrait'] },
    cellStyle: { control: { type: 'select' }, options: ['detailed', 'compact'] },
    showAlertBanner: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<ScheduleV2Args>;

export const ShotgunStart: Story = {
  args: {
    courtsCount: 6,
    schedulePattern: 'shotgun',
    headerLayout: 'itf',
    orientation: 'auto',
    cellStyle: 'detailed',
    showAlertBanner: false,
  },
};

export const SequentialTimes: Story = {
  args: {
    courtsCount: 5,
    schedulePattern: 'sequential',
    headerLayout: 'itf',
    orientation: 'auto',
    cellStyle: 'detailed',
    showAlertBanner: false,
  },
};

export const MixedScheduling: Story = {
  args: {
    courtsCount: 8,
    schedulePattern: 'mixed',
    headerLayout: 'grand-slam',
    orientation: 'landscape',
    cellStyle: 'compact',
    showAlertBanner: true,
  },
};

export const SmallVenue: Story = {
  args: {
    courtsCount: 3,
    schedulePattern: 'sequential',
    headerLayout: 'minimal',
    orientation: 'portrait',
    cellStyle: 'detailed',
    showAlertBanner: false,
  },
};
