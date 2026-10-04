import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { generateOrderOfPlayPDF } from '../../generators/orderOfPlay';
import type { ScheduleData, ScheduleMatch } from '../../core/extractScheduleData';
import { pdf } from 'pdf-to-img';

const GIRLS_SINGLES = 'Girls Singles';
const BOYS_SINGLES = 'Boys Singles';
const CENTER_COURT = 'Center Court';
const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(resolve(OUTPUT_DIR, 'fidelity'), { recursive: true });

function makeMatch(
  court: string,
  event: string,
  round: string,
  p1: string,
  n1: string,
  p2: string,
  n2: string,
  score?: string,
  status?: string,
): ScheduleMatch {
  return {
    courtName: court,
    scheduledTime: '',
    eventName: event,
    eventAbbr: event
      .split(' ')
      .map((w) => w[0])
      .join(''),
    roundName: round,
    side1: { name: p1, nationality: n1 },
    side2: { name: p2, nationality: n2 },
    score,
    matchUpStatus: status || (score ? 'COMPLETED' : 'TO_BE_PLAYED'),
  };
}

function buildScheduleData(): ScheduleData {
  return {
    scheduledDate: '2026-03-09',
    courts: ['Court 16', 'Court 17', 'Court 18', 'Court 19', 'Court 20'],
    timeSlots: [
      {
        time: '10:00',
        label: '10:00 AM',
        matches: [
          makeMatch('Court 16', GIRLS_SINGLES, 'R64', 'RHODES, Reiley', 'USA', 'GRIFFITHS, Edie', 'GBR', '7-6(7) 6-3'),
          makeMatch('Court 17', GIRLS_SINGLES, 'R64', 'GIRIBALAN, Kaia', 'USA', 'LIN, Elicia', 'CAN', '6-3 6-1'),
          makeMatch('Court 18', GIRLS_SINGLES, 'R64', 'DEL MASTRO, Daniela', 'USA', 'SUH, Sophie', 'USA', '6-4 6-2'),
          makeMatch('Court 19', GIRLS_SINGLES, 'R64', 'PANDEY, Tanvi', 'USA', 'ZINGG, Liv', 'GBR'),
          makeMatch(
            'Court 20',
            GIRLS_SINGLES,
            'R64',
            'KOCKINS, Armina',
            'USA',
            'ESTRADA CORTES, Hanne',
            'MEX',
            '6-4 6-7(1) 6-1',
          ),
        ],
      },
      {
        time: '11:00',
        label: '11:00 AM',
        matches: [
          makeMatch('Court 16', GIRLS_SINGLES, 'R64', 'BAKER, Kaya', 'USA', 'COMBS, Emery', 'USA', '6-0 6-2'),
          makeMatch('Court 17', GIRLS_SINGLES, 'R64', 'PAPADOPOULOS, Kalista', 'USA', 'PARK, Sera', 'KOR'),
          makeMatch('Court 18', GIRLS_SINGLES, 'R64', 'PLESKIN, Anastasia', 'USA', 'ALLEGRE, Camille', 'FRA'),
          makeMatch('Court 19', BOYS_SINGLES, 'R64', 'LEVRESSE ZAVALA, Jose', 'MEX', 'WANG, Allison', 'USA'),
          makeMatch('Court 20', BOYS_SINGLES, 'R64', 'WATANABE, Aoi', 'JPN', 'SHAO, Caroline', 'USA', '6-3 6-4'),
        ],
      },
      {
        time: '14:30',
        label: '2:30 PM',
        matches: [
          makeMatch(
            'Court 16',
            GIRLS_SINGLES,
            'R64',
            'BREWER, Ava',
            'USA',
            'CARDENAS, Abril',
            'MEX',
            undefined,
            'IN_PROGRESS',
          ),
          makeMatch('Court 17', BOYS_SINGLES, 'R64', 'JAUBERT, Sylvana', 'USA', 'SEVERSON, Julia', 'USA'),
          makeMatch('Court 18', BOYS_SINGLES, 'R64', 'AVRAMOVIC, Ana', 'USA', 'MORENO, Carlota', 'USA'),
          makeMatch('Court 19', BOYS_SINGLES, 'R64', 'DELGADO, Filipa', 'USA', 'RHODEN, Briley', 'USA'),
          makeMatch('Court 20', BOYS_SINGLES, 'R64', 'YOSHIKAWA, Manami', 'USA', 'CELEBRINI, Charlie', 'CAN'),
        ],
      },
    ],
  };
}

describe('Populated schedule (manual data)', () => {
  it('generates a 5-court OOP with match data (J300 style)', async () => {
    const scheduleData = buildScheduleData();

    const doc = generateOrderOfPlayPDF(scheduleData, {
      header: {
        layout: 'itf',
        tournamentName: 'J300 Tucson',
        subtitle: 'ORDER OF PLAY\nMonday 09 Mar 2026, Page 1 of 2',
        startDate: '09 Mar 2026',
        location: 'Tucson, USA',
        grade: 'J300',
        supervisor: 'Douglas Rice',
      },
      alertBanner: 'PLAY HAS BEEN CANCELED FOR TODAY. 9a. START. DOUBLES DRAW and OP WILL BE POSTED LATER.',
      notes: [
        'Any necessary weather updates will be posted on the OP. Any match on any court may be moved.',
        'Lucky Loser sign-in CLOSES @ 9:30 a.m.',
        'Doubles Registration CLOSES @ 12:00 p.m. Doubles starts on Tuesday.',
      ],
      officials: [
        { role: 'Order of Play released by', name: '' },
        { role: 'Tournament Director', name: 'Milena Patel' },
        { role: 'Supervisor', name: 'Douglas Rice' },
      ],
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'oop-j300-populated.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/oop-j300-populated-page${pageNum}.png`), page);
    }
    expect(pageNum).toEqual(1);
  });

  it('generates a 3-court portrait OOP', async () => {
    const scheduleData: ScheduleData = {
      scheduledDate: '2026-03-15',
      courts: [CENTER_COURT, 'Court 1', 'Court 2'],
      timeSlots: [
        {
          time: '10:00',
          label: '10:00 AM',
          matches: [
            makeMatch(CENTER_COURT, 'Mens Singles', 'SF', 'SINNER, Jannik', 'ITA', 'ALCARAZ, Carlos', 'ESP'),
            makeMatch('Court 1', 'Womens Singles', 'SF', 'SABALENKA, Aryna', 'BLR', 'GAUFF, Coco', 'USA'),
            makeMatch('Court 2', 'Mens Doubles', 'QF', 'BOLELLI/VAVASSORI', 'ITA', 'AREVALO/PAVIC', 'ESA/CRO'),
          ],
        },
        {
          time: '14:00',
          label: '2:00 PM',
          matches: [
            makeMatch(CENTER_COURT, 'Womens Singles', 'SF', 'SWIATEK, Iga', 'POL', 'RYBAKINA, Elena', 'KAZ'),
            makeMatch('Court 1', 'Mens Singles', 'SF', 'DJOKOVIC, Novak', 'SRB', 'MEDVEDEV, Daniil', 'RUS'),
          ],
        },
      ],
    };

    const doc = generateOrderOfPlayPDF(scheduleData, {
      header: {
        layout: 'grand-slam',
        tournamentName: 'Australian Open 2026',
        subtitle: 'ORDER OF PLAY - Day 11',
        startDate: '25 Jan 2026',
        location: 'Melbourne, Australia',
      },
      page: { orientation: 'portrait' },
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'oop-3-courts-semifinal.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/oop-3-courts-sf-page${pageNum}.png`), page);
    }
  });
});
