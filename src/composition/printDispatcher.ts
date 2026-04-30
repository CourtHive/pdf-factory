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
import type { PrintRequest, PrintScheduleRequest } from './printModalTypes';
import { extractScheduleData } from '../core/extractScheduleData';
import { generateOrderOfPlayPDF } from '../generators/orderOfPlay';
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
    case 'draw':
    case 'playerList':
    case 'courtCards':
    case 'signInSheet':
    case 'matchCard':
      return { success: false, error: `executePrint: type "${request.type}" not yet implemented` };
  }
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
