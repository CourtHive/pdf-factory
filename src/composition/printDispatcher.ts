/**
 * Print dispatcher — the main entry point for TMX integration.
 *
 * Takes a PrintRequest from a modal and produces a PDF.
 * Uses the CompositionConfig from the request to configure
 * headers, footers, format presets, and content options.
 */

import jsPDF from 'jspdf';
import type { PrintRequest } from './printModalTypes';

export interface PrintResult {
  success: boolean;
  doc?: jsPDF;
  blob?: Blob;
  filename?: string;
  error?: string;
}

/**
 * Execute a print request and return the PDF.
 *
 * The caller (TMX) provides tournament data via the factory engine —
 * this function extracts the needed data using the factory queries
 * and generates the appropriate PDF.
 *
 * Usage in TMX:
 * ```typescript
 * import { executePrint } from 'pdf-factory';
 * import { tournamentEngine } from 'tods-competition-factory';
 *
 * const result = executePrint(printRequest, { tournamentEngine });
 * if (result.success && result.blob) {
 *   window.open(URL.createObjectURL(result.blob));
 * }
 * ```
 */
export function executePrint(request: PrintRequest, _engine: { tournamentEngine: any }): PrintResult {
  // This is a placeholder — each type will be implemented
  // as the TMX integration progresses.
  // For now it validates the request structure.

  if (!request.type) return { success: false, error: 'Missing request type' };
  if (!request.composition) return { success: false, error: 'Missing composition config' };

  const filename = generateFilename(request);

  return {
    success: true,
    filename,
    // doc and blob will be populated by the specific generator
  };
}

function generateFilename(request: PrintRequest): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  switch (request.type) {
    case 'draw':
      return `draw-${timestamp}.pdf`;
    case 'schedule':
      return `order-of-play-${request.scheduledDate || timestamp}.pdf`;
    case 'playerList':
      return `player-list-${timestamp}.pdf`;
    case 'courtCards':
      return `court-cards-${timestamp}.pdf`;
    case 'signInSheet':
      return `sign-in-sheet-${timestamp}.pdf`;
    case 'matchCard':
      return `match-cards-${timestamp}.pdf`;
  }
}
