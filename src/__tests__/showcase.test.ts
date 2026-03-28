/**
 * Comprehensive showcase test suite using mocksEngine.
 *
 * Generates every combination of draw type, size, preset, and completion state
 * so we can visually inspect and iterate on fidelity.
 *
 * mocksEngine key parameters:
 *   drawProfiles[]: { drawSize, drawType, seedsCount, eventName }
 *   venueProfiles[]: { courtsCount, venueName }
 *   participantsProfile: { participantsCount }
 *   completeAllMatchUps: boolean
 *   scheduleCompletedMatchUps: boolean
 *   autoSchedule: boolean
 *   setState: true  (always use this)
 *
 * drawType values: SINGLE_ELIMINATION (default), ROUND_ROBIN, ROUND_ROBIN_WITH_PLAYOFF,
 *                  DOUBLE_ELIMINATION, COMPASS, OLYMPIC, LUCKY_DRAW, AD_HOC
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';

import { extractDrawData } from '../core/extractDrawData';
import { extractRoundRobinData } from '../core/extractRoundRobinData';
import { extractScheduleData } from '../core/extractScheduleData';
import { extractParticipantData } from '../core/extractParticipantData';
import { extractCourtCardData } from '../core/extractCourtCardData';

import { renderTraditionalDraw } from '../renderers/traditionalDraw';
import { renderRoundRobinGroup } from '../renderers/roundRobinDraw';
import { renderLuckyDraw } from '../renderers/luckyDraw';
import { splitDraw } from '../renderers/drawSplitter';

import { createDoc, getPageRegions } from '../composition/page';
import { renderHeader } from '../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../composition/footerLayouts';
import { getPreset, mergePreset } from '../config/formatPresets';

import { generatePlayerListPDF } from '../generators/playerList';
import { generateSchedulePDF } from '../generators/schedule';
import { generateCourtCardPDF } from '../generators/courtCard';

const OUTPUT_DIR = resolve(__dirname, '__output__/showcase');
mkdirSync(OUTPUT_DIR, { recursive: true });

function writePdf(doc: any, filename: string) {
  const bytes = doc.output('arraybuffer');
  expect(bytes.byteLength).toBeGreaterThan(0);
  writeFileSync(resolve(OUTPUT_DIR, filename), Buffer.from(bytes));
}

function setupTournament(config: any) {
  let result: any = mocksEngine.generateTournamentRecord({ ...config, setState: true });
  expect(result.success).toEqual(true);
  return result;
}

function getTournamentMeta() {
  let info: any = tournamentEngine.getTournamentInfo();
  return {
    name: info.tournamentInfo?.tournamentName || 'Tournament',
    startDate: info.tournamentInfo?.startDate,
    endDate: info.tournamentInfo?.endDate,
  };
}

function getFirstDraw() {
  let events: any = tournamentEngine.getEvents();
  let participants: any = tournamentEngine.getParticipants({
    participantFilters: { participantTypes: ['INDIVIDUAL'] },
  });
  return {
    event: events.events?.[0],
    drawDefinition: events.events?.[0]?.drawDefinitions?.[0],
    participants: participants.participants || [],
  };
}

// ============================================================
// SINGLE ELIMINATION — every preset, multiple sizes
// ============================================================

describe('Showcase: Single Elimination draws', () => {
  const presets = ['wimbledon', 'usOpen', 'rolandGarros', 'australianOpen', 'itfJunior'];
  const sizes = [16, 32, 64];

  for (const presetName of presets) {
    for (const drawSize of sizes) {
      it(`${presetName} ${drawSize}-draw, completed`, () => {
        setupTournament({
          drawProfiles: [{ drawSize, eventName: 'Singles', seedsCount: Math.min(16, drawSize / 2) }],
          completeAllMatchUps: true,
        });

        const format = getPreset(presetName);
        const meta = getTournamentMeta();
        const { drawDefinition, participants } = getFirstDraw();
        const drawData = extractDrawData({ drawDefinition, participants });

        const doc = createDoc(format.page, drawSize);
        const footerH = measureFooterHeight({ layout: 'standard', showPageNumbers: true, showTimestamp: true });
        const headerH = renderHeader(
          doc,
          { layout: 'itf', tournamentName: meta.name, subtitle: `Singles - ${presetName}`, startDate: meta.startDate },
          format.page,
        );
        const regions = getPageRegions(doc, format.page, headerH, footerH);
        renderTraditionalDraw(doc, drawData, format, regions);
        renderFooter(doc, { layout: 'standard', showPageNumbers: true, showTimestamp: true }, format.page, 1);

        writePdf(doc, `se-${drawSize}-${presetName}.pdf`);
      });
    }
  }

  it('128-draw split into halves (wimbledon)', () => {
    setupTournament({
      drawProfiles: [{ drawSize: 128, eventName: 'Singles', seedsCount: 16 }],
      completeAllMatchUps: true,
    });

    const format = getPreset('wimbledon');
    const meta = getTournamentMeta();
    const { drawDefinition, participants } = getFirstDraw();
    const drawData = extractDrawData({ drawDefinition, participants });
    const segments = splitDraw(drawData, { maxPositionsPerPage: 64, includeOverlapRounds: true, summaryPage: true });

    const doc = createDoc(format.page, 128);
    const footerH = measureFooterHeight({ layout: 'standard', showPageNumbers: true, showTimestamp: true });

    for (let i = 0; i < segments.length; i++) {
      if (i > 0) doc.addPage();
      const seg = segments[i];
      const headerH = renderHeader(
        doc,
        { layout: 'grand-slam', tournamentName: meta.name, subtitle: `Singles - ${seg.label}` },
        format.page,
      );
      const regions = getPageRegions(doc, format.page, headerH, footerH);

      if (seg.slots.length > 0) {
        const segData = { ...drawData, slots: seg.slots, matchUps: seg.matchUps };
        renderTraditionalDraw(
          doc,
          segData,
          format,
          regions,
          seg.startPosition - 1,
          seg.endPosition - seg.startPosition + 1,
        );
      }

      renderFooter(doc, { layout: 'standard', showPageNumbers: true, showTimestamp: true }, format.page, i + 1);
    }

    writePdf(doc, 'se-128-wimbledon-split.pdf');
  });

  it('16-draw incomplete (no scores)', () => {
    setupTournament({
      drawProfiles: [{ drawSize: 16, eventName: 'Singles', seedsCount: 4 }],
      completeAllMatchUps: false,
    });

    const format = getPreset('itfJunior');
    const meta = getTournamentMeta();
    const { drawDefinition, participants } = getFirstDraw();
    const drawData = extractDrawData({ drawDefinition, participants });

    const doc = createDoc(format.page, 16);
    const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
    const headerH = renderHeader(
      doc,
      { layout: 'itf', tournamentName: meta.name, subtitle: 'Singles - Blank Draw' },
      format.page,
    );
    const regions = getPageRegions(doc, format.page, headerH, footerH);
    renderTraditionalDraw(doc, drawData, format, regions);
    renderFooter(doc, { layout: 'standard', showTimestamp: true }, format.page, 1);

    writePdf(doc, 'se-16-blank.pdf');
  });
});

// ============================================================
// ROUND ROBIN
// ============================================================

describe('Showcase: Round Robin draws', () => {
  for (const drawSize of [4, 8, 16]) {
    it(`round robin ${drawSize} players, completed`, () => {
      setupTournament({
        drawProfiles: [{ drawSize, drawType: 'ROUND_ROBIN', eventName: 'RR Singles' }],
        completeAllMatchUps: true,
      });

      const format = getPreset('itfJunior');
      const meta = getTournamentMeta();
      const { drawDefinition, participants } = getFirstDraw();
      const mainStructure = drawDefinition?.structures?.[0];
      const groups = extractRoundRobinData({ structure: mainStructure, participants });

      const doc = createDoc(format.page, drawSize);
      const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
      const headerH = renderHeader(
        doc,
        { layout: 'itf', tournamentName: meta.name, subtitle: `Round Robin - ${drawSize} players` },
        format.page,
      );
      const regions = getPageRegions(doc, format.page, headerH, footerH);

      let y = regions.contentY;
      for (const group of groups) {
        y = renderRoundRobinGroup(doc, group, format, regions, y) + 6;
      }

      renderFooter(doc, { layout: 'standard', showTimestamp: true }, format.page, 1);
      writePdf(doc, `rr-${drawSize}.pdf`);
    });
  }
});

// ============================================================
// LUCKY DRAW (no connectors)
// ============================================================

describe('Showcase: Lucky draws', () => {
  for (const drawSize of [8, 16, 32]) {
    it(`lucky draw ${drawSize} players`, () => {
      setupTournament({
        drawProfiles: [{ drawSize, eventName: 'Lucky Draw', seedsCount: 0 }],
        completeAllMatchUps: true,
      });

      const format = mergePreset('itfJunior', { renderStyle: 'lucky-draw' });
      const meta = getTournamentMeta();
      const { drawDefinition, participants } = getFirstDraw();
      const drawData = extractDrawData({ drawDefinition, participants });

      const doc = createDoc(format.page, drawSize);
      const footerH = measureFooterHeight({ layout: 'standard', showTimestamp: true });
      const headerH = renderHeader(
        doc,
        { layout: 'minimal', tournamentName: meta.name, subtitle: `Lucky Draw - ${drawSize}` },
        format.page,
      );
      const regions = getPageRegions(doc, format.page, headerH, footerH);
      renderLuckyDraw(doc, drawData, format, regions);
      renderFooter(doc, { layout: 'standard', showTimestamp: true }, format.page, 1);

      writePdf(doc, `lucky-${drawSize}.pdf`);
    });
  }
});

// ============================================================
// PLAYER LISTS
// ============================================================

describe('Showcase: Player Lists', () => {
  it('player list from 64-draw tournament', () => {
    setupTournament({
      drawProfiles: [
        { drawSize: 32, eventName: 'Boys Singles', seedsCount: 8 },
        { drawSize: 16, eventName: 'Girls Singles', seedsCount: 4 },
      ],
    });

    const meta = getTournamentMeta();
    let result: any = tournamentEngine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
    });
    let events: any = tournamentEngine.getEvents();
    const eventEntries = (events.events || []).map((e: any) => ({
      eventName: e.eventName,
      entries: e.entries || [],
    }));

    const players = extractParticipantData({ participants: result.participants || [], eventEntries });

    const doc = generatePlayerListPDF(players, {
      header: { tournamentName: meta.name, startDate: meta.startDate, subtitle: 'Participant List' },
    });

    writePdf(doc, 'player-list-multi-event.pdf');
  });
});

// ============================================================
// SCHEDULES
// ============================================================

describe('Showcase: Schedules', () => {
  it('schedule with 8 courts', () => {
    setupTournament({
      drawProfiles: [{ drawSize: 32 }],
      venueProfiles: [{ courtsCount: 8, venueName: 'National Tennis Center' }],
      autoSchedule: true,
      scheduleCompletedMatchUps: true,
      completeAllMatchUps: false,
    });

    const meta = getTournamentMeta();
    let result: any = tournamentEngine.competitionScheduleMatchUps();
    const matchUps = (result.dateMatchUps || []).concat(result.completedMatchUps || []);
    let venues: any = tournamentEngine.getVenuesAndCourts();

    const scheduleData = extractScheduleData({
      matchUps,
      venues: venues.venues || [],
      scheduledDate: meta.startDate,
    });

    const doc = generateSchedulePDF(scheduleData, {
      header: { tournamentName: meta.name, startDate: meta.startDate },
      landscape: 'auto',
      notes: ['All times are local.', 'Matches may be moved to any court.'],
    });

    writePdf(doc, 'schedule-8-courts.pdf');
  });
});

// ============================================================
// COURT CARDS
// ============================================================

describe('Showcase: Court Cards', () => {
  it('court cards from scheduled tournament', () => {
    setupTournament({
      drawProfiles: [{ drawSize: 16 }],
      venueProfiles: [{ courtsCount: 4, venueName: 'Center Club' }],
      autoSchedule: true,
      scheduleCompletedMatchUps: true,
      completeAllMatchUps: false,
    });

    const meta = getTournamentMeta();
    let result: any = tournamentEngine.competitionScheduleMatchUps();
    const matchUps = (result.dateMatchUps || []).concat(result.completedMatchUps || []);
    let venues: any = tournamentEngine.getVenuesAndCourts();

    const cards = extractCourtCardData({ matchUps, venues: venues.venues || [] });

    if (cards.length > 0) {
      const doc = generateCourtCardPDF(cards, { tournamentName: meta.name });
      writePdf(doc, 'court-cards-4.pdf');
    } else {
      // Fallback: generate from mock data
      const doc = generateCourtCardPDF(
        [
          {
            courtName: 'Court 1',
            venueName: 'Center Club',
            currentMatch: {
              eventName: 'Singles',
              roundName: 'QF',
              side1: { name: 'SINNER, Jannik', nationality: 'ITA' },
              side2: { name: 'ALCARAZ, Carlos', nationality: 'ESP' },
            },
            nextMatch: {
              eventName: 'Singles',
              roundName: 'QF',
              scheduledTime: '2:00 PM',
              side1: { name: 'DJOKOVIC, Novak', nationality: 'SRB' },
              side2: { name: 'MEDVEDEV, Daniil', nationality: 'RUS' },
            },
          },
        ],
        { tournamentName: meta.name },
      );
      writePdf(doc, 'court-cards-mock.pdf');
    }
  });
});
