/**
 * Print dispatcher — the main entry point for TMX integration.
 *
 * Takes a PrintRequest from a modal (with a resolved CompositionConfig)
 * and produces a PDF. Each `request.type` dispatches to a per-type
 * branch that extracts data from the factory engine and calls the
 * matching generator.
 *
 * Usage:
 * ```typescript
 * import { resolveCompositionConfig, executePrint } from 'pdf-factory';
 * import { tournamentEngine } from 'tods-competition-factory';
 *
 * const composition = resolveCompositionConfig({ providerConfig, tournamentRecord, printType: 'schedule' });
 * const result = executePrint(
 *   { type: 'schedule', scheduledDate, composition },
 *   { tournamentEngine },
 * );
 * if (result.success && result.blob) {
 *   window.open(URL.createObjectURL(result.blob));
 * }
 * ```
 */

import jsPDF from 'jspdf';
import type {
  PrintRequest,
  PrintScheduleRequest,
  PrintPlayerListRequest,
  PrintSignInSheetRequest,
  PrintCourtCardsRequest,
  PrintMatchCardRequest,
  PrintDrawRequest,
} from './printModalTypes';
import type { CompositionConfig, ContentOptions } from './editorTypes';
import type { HeaderConfig, FooterConfig } from '../config/types';
import type { TournamentHeader } from '../layout/headers';
import { extractScheduleData } from '../core/extractScheduleData';
import { extractParticipantData } from '../core/extractParticipantData';
import { extractCourtCardData } from '../core/extractCourtCardData';
import { structureToDrawData, findStructure } from '../core/drawsDataToDrawData';
import { generateOrderOfPlayPDF } from '../generators/orderOfPlay';
import { generatePlayerListPDF } from '../generators/playerList';
import { generateSignInSheetPDF } from '../generators/signInSheet';
import { generateCourtCardPDF } from '../generators/courtCard';
import { generateMatchCardPDF, type MatchCardData } from '../generators/matchCard';
import {
  generateTraditionalDrawPDF,
  generateSplitDrawPDF,
  generateConsolationDrawPDF,
  generateDoubleEliminationPDF,
  type DrawPDFOptions,
} from '../generators/drawPDF';
import { composeOrderOfPlayOptions } from './composeOrderOfPlayOptions';

export interface PrintResult {
  success: boolean;
  doc?: jsPDF;
  blob?: Blob;
  filename?: string;
  error?: string;
}

export interface PrintContext {
  /** A factory engine with `competitionScheduleMatchUps()` + `getVenuesAndCourts()` for schedule prints (others as needed). */
  tournamentEngine: any;
}

export function executePrint(request: PrintRequest, context: PrintContext): PrintResult {
  if (!request?.type) return { success: false, error: 'Missing request type' };
  if (!request.composition) return { success: false, error: 'Missing composition config' };
  if (!context?.tournamentEngine) return { success: false, error: 'Missing tournamentEngine in context' };

  switch (request.type) {
    case 'schedule':
      return executeScheduleBranch(request, context);
    case 'playerList':
      return executePlayerListBranch(request, context);
    case 'signInSheet':
      return executeSignInSheetBranch(request, context);
    case 'courtCards':
      return executeCourtCardsBranch(request, context);
    case 'matchCard':
      return executeMatchCardBranch(request, context);
    case 'draw':
      return executeDrawBranch(request, context);
  }
}

// ── Draw branch ───────────────────────────────────────────────────────────────

function executeDrawBranch(request: PrintDrawRequest, context: PrintContext): PrintResult {
  if (!request.drawId) {
    return { success: false, error: 'PrintDrawRequest requires drawId' };
  }
  const engine = context.tournamentEngine;
  if (typeof engine.getEventData !== 'function') {
    return { success: false, error: 'engine.getEventData is not a function' };
  }
  const { eventData } = engine.getEventData({ drawId: request.drawId }) ?? {};
  if (!eventData?.drawsData?.length) {
    return { success: false, error: `No draw data found for drawId "${request.drawId}"` };
  }

  const tournamentInfo = eventData.tournamentInfo ?? {};
  const eventInfo = eventData.eventInfo ?? {};
  const structures = eventData.drawsData[0].structures ?? [];
  const mainStruct = structures.find((s: any) => s.stage === 'MAIN');
  const hasConsolation = structures.some((s: any) => s.stage === 'CONSOLATION');
  const hasPlayOff = structures.some((s: any) => s.stage === 'PLAY_OFF');

  const drawContent = getContent(request.composition, 'draw');
  const splitStrategy = drawContent?.splitStrategy ?? 'single-page';

  const pdfOpts: DrawPDFOptions = {
    header: composeFullHeader(request.composition, tournamentInfo, eventInfo),
    footer: composeFullFooter(request.composition),
    page: request.composition.page,
    preset: undefined, // resolved from CompositionConfig.format if needed
  };

  let doc: jsPDF | undefined;
  try {
    if (hasConsolation && hasPlayOff) {
      doc = generateDoubleEliminationPDF(
        {
          winnersBracket: mainStruct ? structureToDrawData(mainStruct) : emptyDraw(),
          losersBracket: pickConsolation(eventData),
          deciderMatch: pickPlayOff(eventData),
        },
        pdfOpts,
      );
    } else if (hasConsolation) {
      const consolStructures = structures.map((s: any) => ({
        name: s.structureName,
        stage: s.stage,
        drawData: structureToDrawData(s),
      }));
      doc = generateConsolationDrawPDF(consolStructures, pdfOpts);
    } else if (mainStruct) {
      const drawData = structureToDrawData(mainStruct);
      doc =
        splitStrategy !== 'single-page'
          ? generateSplitDrawPDF(drawData, pdfOpts)
          : generateTraditionalDrawPDF(drawData, pdfOpts);
    }
  } catch (err) {
    return {
      success: false,
      error: `draw generator failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!doc) {
    return { success: false, error: 'No matching draw renderer for this structure' };
  }

  const slug = (eventInfo.eventName || tournamentInfo.tournamentName || 'draw')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  return {
    success: true,
    doc,
    blob: doc.output('blob') as Blob,
    filename: `draw-${slug}.pdf`,
  };
}

function emptyDraw() {
  return { drawName: '', drawSize: 0, drawType: '', totalRounds: 0, slots: [], matchUps: [], seedAssignments: [] };
}

function pickConsolation(eventData: any) {
  const struct = findStructure(eventData.drawsData, 'CONSOLATION');
  return struct ? structureToDrawData(struct) : emptyDraw();
}

function pickPlayOff(eventData: any) {
  const struct = findStructure(eventData.drawsData, 'PLAY_OFF');
  return struct ? structureToDrawData(struct) : undefined;
}

function composeFullHeader(
  composition: Partial<CompositionConfig>,
  tournamentInfo: any,
  eventInfo: any,
): HeaderConfig | undefined {
  if (composition.header?.layout === 'none') return undefined;
  const overlay = composition.header ?? {};
  return {
    layout: overlay.layout ?? 'itf',
    tournamentName: overlay.tournamentName ?? tournamentInfo?.tournamentName ?? eventInfo?.eventName ?? 'Tournament',
    subtitle: overlay.subtitle ?? eventInfo?.eventName,
    startDate: overlay.startDate ?? tournamentInfo?.startDate,
    endDate: overlay.endDate ?? tournamentInfo?.endDate,
    location: overlay.location ?? tournamentInfo?.venues?.[0]?.venueName,
    organizer: overlay.organizer,
    surface: overlay.surface ?? eventInfo?.surfaceCategory,
    grade: overlay.grade,
    supervisor: overlay.supervisor,
    city: overlay.city,
    country: overlay.country ?? tournamentInfo?.hostCountryCode,
    prizeMoney: overlay.prizeMoney,
    currency: overlay.currency,
    tournamentId: overlay.tournamentId,
    sectionLabel: overlay.sectionLabel,
    leftLogoBase64: overlay.leftLogoBase64,
    rightLogoBase64: overlay.rightLogoBase64,
    chiefUmpire: overlay.chiefUmpire,
  };
}

function composeFullFooter(composition: Partial<CompositionConfig>): FooterConfig | undefined {
  if (composition.footer?.layout === 'none') return undefined;
  const overlay = composition.footer ?? {};
  return {
    layout: overlay.layout ?? 'standard',
    showPageNumbers: overlay.showPageNumbers ?? true,
    showTimestamp: overlay.showTimestamp ?? true,
    notes: overlay.notes,
    officials: overlay.officials,
    seedAssignments: overlay.seedAssignments,
    prizeMoney: overlay.prizeMoney,
    signatureLines: overlay.signatureLines,
    drawCeremonyDate: overlay.drawCeremonyDate,
    releaseDate: overlay.releaseDate,
    withdrawals: overlay.withdrawals,
    luckyLosers: overlay.luckyLosers,
  };
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function composeTournamentHeader(composition: Partial<CompositionConfig>): TournamentHeader | undefined {
  const header = composition.header;
  if (!header || header.layout === 'none') return undefined;
  return {
    tournamentName: header.tournamentName ?? '',
    subtitle: header.subtitle,
    startDate: header.startDate,
    endDate: header.endDate,
    location: header.location,
    organizer: header.organizer,
  };
}

function getContent<K extends keyof ContentOptions>(
  composition: Partial<CompositionConfig>,
  key: K,
): ContentOptions[K] | undefined {
  return composition.content?.[key];
}

function fetchEventParticipants(
  engine: any,
  eventId: string | undefined,
):
  | { success: true; participants: any[]; eventEntries: { eventName: string; entries: any[] }[]; eventName: string }
  | { success: false; error: string } {
  if (typeof engine.getParticipants !== 'function') {
    return { success: false, error: 'engine.getParticipants is not a function' };
  }
  // withScaleValues hydrates ranking/rating onto each participant; withSeeding
  // attaches seedAssignments per event so we can resolve seedValue per entry.
  const { participants = [] } =
    engine.getParticipants({
      participantFilters: { participantTypes: ['INDIVIDUAL'] },
      withScaleValues: true,
      withSeeding: true,
    }) ?? {};

  if (eventId) {
    if (typeof engine.getEvent !== 'function') {
      return { success: false, error: 'engine.getEvent is not a function' };
    }
    const { event } = engine.getEvent({ eventId }) ?? {};
    if (!event) return { success: false, error: `Event "${eventId}" not found` };

    const entryIds = new Set((event.entries ?? []).map((e: any) => e.participantId));
    const filtered = participants.filter((p: any) => entryIds.has(p.participantId));
    return {
      success: true,
      participants: filtered,
      eventEntries: [{ eventName: event.eventName ?? '', entries: enrichEntriesWithSeeds(event) }],
      eventName: event.eventName ?? '',
    };
  }

  // No event filter — aggregate entries across every event so the resulting
  // ParticipantRow.events column lists every event each participant is in,
  // and the seed/entry-status columns get populated for at least one event.
  const allEvents: any[] = engine.getEvents?.()?.events ?? [];
  const eventEntries = allEvents.map((event: any) => ({
    eventName: event.eventName ?? '',
    entries: enrichEntriesWithSeeds(event),
  }));
  return { success: true, participants, eventEntries, eventName: '' };
}

/**
 * event.entries contains entryStatus + participantId but not seedValue.
 * Seed assignments live separately on each draw's MAIN structure. Merge
 * them into the entries so extractParticipantData can populate the seed
 * column.
 */
function enrichEntriesWithSeeds(event: any): any[] {
  const entries: any[] = event.entries ?? [];
  const seedMap = new Map<string, number>();
  for (const drawDef of event.drawDefinitions ?? []) {
    for (const structure of drawDef.structures ?? []) {
      if (structure.stage && structure.stage !== 'MAIN') continue;
      for (const sa of structure.seedAssignments ?? []) {
        if (!sa?.participantId || sa.seedValue === undefined) continue;
        const num = Number(sa.seedValue);
        if (!Number.isNaN(num) && !seedMap.has(sa.participantId)) seedMap.set(sa.participantId, num);
      }
    }
  }
  if (seedMap.size === 0) return entries;
  return entries.map((e) => (seedMap.has(e.participantId) ? { ...e, seedValue: seedMap.get(e.participantId) } : e));
}

// ── Player list branch ────────────────────────────────────────────────────────

function executePlayerListBranch(request: PrintPlayerListRequest, context: PrintContext): PrintResult {
  const fetched = fetchEventParticipants(context.tournamentEngine, request.eventId);
  if (!fetched.success) return fetched;

  const players = extractParticipantData({
    participants: fetched.participants,
    eventEntries: fetched.eventEntries,
  });

  const playerListContent = getContent(request.composition, 'playerList');
  let doc: jsPDF;
  try {
    doc = generatePlayerListPDF(players, {
      header: composeTournamentHeader(request.composition),
      includeRanking: playerListContent?.includeRanking,
      includeEvents: playerListContent?.includeEvents,
      groupByEvent: playerListContent?.groupByEvent,
    });
  } catch (err) {
    return {
      success: false,
      error: `generatePlayerListPDF failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const slug = (fetched.eventName || 'all').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return {
    success: true,
    doc,
    blob: doc.output('blob') as Blob,
    filename: `player-list-${slug}.pdf`,
  };
}

// ── Sign-in sheet branch ──────────────────────────────────────────────────────

function executeSignInSheetBranch(request: PrintSignInSheetRequest, context: PrintContext): PrintResult {
  if (!request.eventId) {
    return { success: false, error: 'PrintSignInSheetRequest requires eventId' };
  }
  const fetched = fetchEventParticipants(context.tournamentEngine, request.eventId);
  if (!fetched.success) return fetched;

  const players = extractParticipantData({
    participants: fetched.participants,
    eventEntries: fetched.eventEntries,
  });

  let doc: jsPDF;
  try {
    doc = generateSignInSheetPDF(players, {
      header: composeTournamentHeader(request.composition),
      eventName: fetched.eventName,
    });
  } catch (err) {
    return {
      success: false,
      error: `generateSignInSheetPDF failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const slug = (fetched.eventName || 'all').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return {
    success: true,
    doc,
    blob: doc.output('blob') as Blob,
    filename: `sign-in-sheet-${slug}.pdf`,
  };
}

// ── Court cards branch ────────────────────────────────────────────────────────

function executeCourtCardsBranch(request: PrintCourtCardsRequest, context: PrintContext): PrintResult {
  const engine = context.tournamentEngine;
  const fetched = fetchScheduleData(engine, request.venueId);
  if (!fetched.success) return fetched;

  const cards = extractCourtCardData({
    matchUps: fetched.matchUps,
    venues: fetched.venues,
    scheduledDate: request.scheduledDate,
  });

  const tournamentName = composition_tournamentName(request.composition, engine);
  const courtCardContent = getContent(request.composition, 'courtCard');

  let doc: jsPDF;
  try {
    doc = generateCourtCardPDF(cards, {
      tournamentName,
      cardsPerPage: courtCardContent?.cardsPerPage,
    });
  } catch (err) {
    return {
      success: false,
      error: `generateCourtCardPDF failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const dateSuffix = request.scheduledDate ? `-${request.scheduledDate}` : '';
  return {
    success: true,
    doc,
    blob: doc.output('blob') as Blob,
    filename: `court-cards${dateSuffix}.pdf`,
  };
}

function composition_tournamentName(composition: Partial<CompositionConfig>, engine: any): string {
  const fromComposition = composition.header?.tournamentName;
  if (fromComposition) return fromComposition;
  if (typeof engine.getTournamentInfo === 'function') {
    const info = engine.getTournamentInfo();
    return info?.tournamentInfo?.tournamentName ?? '';
  }
  return '';
}

// ── Match card branch ─────────────────────────────────────────────────────────

function executeMatchCardBranch(request: PrintMatchCardRequest, context: PrintContext): PrintResult {
  if (!Array.isArray(request.matchUpIds) || request.matchUpIds.length === 0) {
    return { success: false, error: 'PrintMatchCardRequest requires non-empty matchUpIds' };
  }
  const engine = context.tournamentEngine;
  if (typeof engine.allTournamentMatchUps !== 'function') {
    return { success: false, error: 'engine.allTournamentMatchUps is not a function' };
  }
  const { matchUps = [] } = engine.allTournamentMatchUps() ?? {};
  const targetIds = new Set(request.matchUpIds);
  const targets: any[] = matchUps.filter((mu: any) => targetIds.has(mu.matchUpId));
  if (targets.length === 0) {
    return { success: false, error: 'No matchUps match the requested matchUpIds' };
  }

  const tournamentName = composition_tournamentName(request.composition, engine);
  const cards: MatchCardData[] = targets.map((mu) => ({
    tournamentName,
    eventName: mu.eventName ?? '',
    roundName: mu.roundName ?? mu.abbreviatedRoundName ?? '',
    matchUpId: mu.matchUpId,
    courtName: mu.schedule?.courtName,
    scheduledTime: mu.schedule?.scheduledTime,
    side1: {
      name: mu.sides?.[0]?.participant?.participantName ?? 'TBD',
      nationality: mu.sides?.[0]?.participant?.nationalityCode ?? '',
      seedValue: mu.sides?.[0]?.seedValue,
    },
    side2: {
      name: mu.sides?.[1]?.participant?.participantName ?? 'TBD',
      nationality: mu.sides?.[1]?.participant?.nationalityCode ?? '',
      seedValue: mu.sides?.[1]?.seedValue,
    },
  }));

  let doc: jsPDF;
  try {
    doc = generateMatchCardPDF(cards, { cardsPerPage: 2, includeScoreBoxes: true });
  } catch (err) {
    return {
      success: false,
      error: `generateMatchCardPDF failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  return {
    success: true,
    doc,
    blob: doc.output('blob') as Blob,
    filename: `match-cards-${cards.length}.pdf`,
  };
}

// ── Schedule branch ───────────────────────────────────────────────────────────

function executeScheduleBranch(request: PrintScheduleRequest, context: PrintContext): PrintResult {
  if (!request.scheduledDate) {
    return { success: false, error: 'PrintScheduleRequest requires scheduledDate' };
  }

  const engine = context.tournamentEngine;
  const fetched = fetchScheduleData(engine, request.venueId);
  if (!fetched.success) return fetched;

  const scheduleData = extractScheduleData({
    matchUps: fetched.matchUps,
    venues: fetched.venues,
    scheduledDate: request.scheduledDate,
  });

  const options = composeOrderOfPlayOptions(request.composition);

  let doc: jsPDF;
  try {
    doc = generateOrderOfPlayPDF(scheduleData, options);
  } catch (err) {
    return {
      success: false,
      error: `generateOrderOfPlayPDF failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  return {
    success: true,
    doc,
    blob: doc.output('blob') as Blob,
    filename: `order-of-play-${request.scheduledDate}.pdf`,
  };
}

interface ScheduleFetchSuccess {
  success: true;
  matchUps: any[];
  venues: any[];
}
interface ScheduleFetchFailure {
  success: false;
  error: string;
}
type ScheduleFetchResult = ScheduleFetchSuccess | ScheduleFetchFailure;

function fetchScheduleData(engine: any, venueId?: string): ScheduleFetchResult {
  if (typeof engine.competitionScheduleMatchUps !== 'function') {
    return { success: false, error: 'engine.competitionScheduleMatchUps is not a function' };
  }
  if (typeof engine.getVenuesAndCourts !== 'function') {
    return { success: false, error: 'engine.getVenuesAndCourts is not a function' };
  }

  const scheduleResult = engine.competitionScheduleMatchUps() ?? {};
  const allMatchUps: any[] = [...(scheduleResult.dateMatchUps ?? []), ...(scheduleResult.completedMatchUps ?? [])];
  // extractScheduleData filters by scheduledDate internally; we don't
  // pre-filter here. Optional venueId filter is applied as a courtesy
  // for callers who want to restrict to a single venue.
  const matchUps = venueId ? allMatchUps.filter((m: any) => m?.schedule?.venueId === venueId) : allMatchUps;

  const venuesResult = engine.getVenuesAndCourts() ?? {};
  const allVenues: any[] = venuesResult.venues ?? [];
  const venues = venueId ? allVenues.filter((v: any) => v.venueId === venueId) : allVenues;

  return { success: true, matchUps, venues };
}
