import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { generateSequentialOOP } from '../../generators/sequentialOOP';
import type { ScheduleData, ScheduleMatch } from '../../core/extractScheduleData';
import { pdf } from 'pdf-to-img';

const ARTHUR_ASHE_STADIUM = 'Arthur Ashe Stadium';
const LOUIS_ARMSTRONG_STADIUM = 'Louis Armstrong Stadium';
const CENTER_COURT = 'Center Court';
const WOMENS_SINGLES = 'Womens Singles';
const MENS_SINGLES = 'Mens Singles';
const OUTPUT_DIR = resolve(__dirname, '../__output__');
mkdirSync(resolve(OUTPUT_DIR, 'fidelity'), { recursive: true });

function m(
  court: string,
  event: string,
  round: string,
  p1: string,
  n1: string,
  p2: string,
  n2: string,
  score?: string,
  time?: string,
  notBefore?: string,
): ScheduleMatch {
  return {
    courtName: court,
    scheduledTime: time || '',
    eventName: event,
    eventAbbr: event
      .split(' ')
      .map((w) => w[0])
      .join(''),
    roundName: round,
    side1: { name: p1, nationality: n1 },
    side2: { name: p2, nationality: n2 },
    score,
    matchUpStatus: score ? 'COMPLETED' : 'TO_BE_PLAYED',
    notBeforeTime: notBefore,
  };
}

describe('Sequential OOP (WTA/Grand Slam style)', () => {
  it('generates WTA Dubai-style OOP', async () => {
    const scheduleData: ScheduleData = {
      scheduledDate: '2025-02-22',
      courts: [CENTER_COURT],
      timeSlots: [
        {
          time: '16:30',
          label: '4:30 PM',
          matches: [
            m(
              CENTER_COURT,
              'Womens Doubles',
              'F',
              '[1] Katerina SINIAKOVA CZE / Taylor TOWNSEND USA',
              '',
              '[3] Su-Wei HSIEH TPE / Jelena OSTAPENKO LAT',
              '',
              undefined,
              '4:30 PM',
            ),
          ],
        },
        {
          time: '19:00',
          label: '7:00 PM',
          matches: [
            m(
              CENTER_COURT,
              WOMENS_SINGLES,
              'F',
              'Clara TAUSON',
              'DEN',
              '[12] Mirra ANDREEVA',
              'RUS',
              undefined,
              undefined,
              '7:00 PM',
            ),
          ],
        },
      ],
    };

    const doc = generateSequentialOOP(scheduleData, {
      header: {
        layout: 'grand-slam',
        tournamentName: 'Dubai Duty Free Tennis Championships',
        subtitle: 'ORDER OF PLAY - SATURDAY, 22 FEBRUARY 2025',
        location: 'DUBAI, UAE',
      },
      accentColor: [120, 50, 140],
      disclaimer: "Matches may be moved at the Supervisor's discretion",
      officials: [
        { role: 'Tournament Director', name: 'Salah Tahlak' },
        { role: 'WTA Supervisor', name: 'Donna Kelso' },
      ],
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'seq-oop-wta-dubai.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/seq-oop-wta-dubai-page${pageNum}.png`), page);
    }
    expect(pageNum).toEqual(1);
  });

  it('generates multi-court OOP (Grand Slam day 1)', async () => {
    const scheduleData: ScheduleData = {
      scheduledDate: '2025-08-25',
      courts: [ARTHUR_ASHE_STADIUM, LOUIS_ARMSTRONG_STADIUM, 'Grandstand', 'Court 5'],
      timeSlots: [
        {
          time: '11:00',
          label: '11:00 AM',
          matches: [
            m(
              ARTHUR_ASHE_STADIUM,
              WOMENS_SINGLES,
              'R1',
              'Madison KEYS',
              'USA',
              'Renata ZARAZUA',
              'MEX',
              '6-2 6-3',
              '11:00 AM',
            ),
            m(
              LOUIS_ARMSTRONG_STADIUM,
              MENS_SINGLES,
              'R1',
              '[1] Jannik SINNER',
              'ITA',
              'Mackenzie McDONALD',
              'USA',
              '6-3 6-4 6-2',
              '11:00 AM',
            ),
            m('Grandstand', WOMENS_SINGLES, 'R1', 'Diane PARRY', 'FRA', 'Priscilla HON', 'AUS', '6-4 6-1', '11:00 AM'),
            m('Court 5', MENS_SINGLES, 'R1', 'Holger RUNE', 'DEN', 'Lloyd HARRIS', 'RSA', undefined, '11:00 AM'),
          ],
        },
        {
          time: '19:00',
          label: '7:00 PM',
          matches: [
            m(
              ARTHUR_ASHE_STADIUM,
              MENS_SINGLES,
              'R1',
              '[3] Carlos ALCARAZ',
              'ESP',
              'Li TU',
              'AUS',
              undefined,
              undefined,
              '7:00 PM',
            ),
          ],
        },
        {
          time: '14:00',
          label: '2:00 PM',
          matches: [
            m(
              LOUIS_ARMSTRONG_STADIUM,
              WOMENS_SINGLES,
              'R1',
              '[5] Jessica PEGULA',
              'USA',
              'Nadia PODOROSKA',
              'ARG',
              undefined,
              undefined,
              '2:00 PM',
            ),
            m(
              'Grandstand',
              MENS_SINGLES,
              'R1',
              'Frances TIAFOE',
              'USA',
              'Yoshihito NISHIOKA',
              'JPN',
              undefined,
              undefined,
              '2:00 PM',
            ),
          ],
        },
      ],
    };

    const doc = generateSequentialOOP(scheduleData, {
      header: {
        layout: 'grand-slam',
        tournamentName: 'US Open 2025',
        subtitle: 'ORDER OF PLAY - Day 1, Monday August 25',
        startDate: '25 Aug 2025',
        location: 'New York, USA',
      },
      accentColor: [30, 60, 120],
      disclaimer: "Matches may be moved at the Supervisor's discretion",
      officials: [
        { role: 'Tournament Director', name: 'Stacey Allaster' },
        { role: 'WTA Supervisor', name: 'Donna Kelso' },
        { role: 'ATP Supervisor', name: 'Wayne McEwen' },
      ],
    });

    const pdfBytes = doc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
    writeFileSync(resolve(OUTPUT_DIR, 'seq-oop-grand-slam.pdf'), Buffer.from(pdfBytes));

    const pages = await pdf(Buffer.from(pdfBytes), { scale: 2.0 });
    let pageNum = 0;
    for await (const page of pages) {
      pageNum++;
      writeFileSync(resolve(OUTPUT_DIR, `fidelity/seq-oop-grand-slam-page${pageNum}.png`), page);
    }
  });
});
