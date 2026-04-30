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
} from './printModalTypes';
import type { CompositionConfig, ContentOptions } from './editorTypes';
import type { TournamentHeader } from '../layout/headers';
import { extractScheduleData } from '../core/extractScheduleData';
import { extractParticipantData } from '../core/extractParticipantData';
import { generateOrderOfPlayPDF } from '../generators/orderOfPlay';
import { generatePlayerListPDF } from '../generators/playerList';
import { generateSignInSheetPDF } from '../generators/signInSheet';
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
    case 'draw':
    case 'courtCards':
    case 'matchCard':
      return { success: false, error: `executePrint: type "${request.type}" not yet implemented` };
  }
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
  const { participants = [] } =
    engine.getParticipants({ participantFilters: { participantTypes: ['INDIVIDUAL'] } }) ?? {};

  if (!eventId) return { success: true, participants, eventEntries: [], eventName: '' };
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
    eventEntries: [{ eventName: event.eventName ?? '', entries: event.entries ?? [] }],
    eventName: event.eventName ?? '',
  };
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
