/**
 * High-level TMX API for PDF generation from eventData.
 *
 * TMX calls: generateFromEventData(eventData, options) → jsPDF
 *
 * This resolves a catalog preset, populates header/footer from
 * tournamentInfo/eventInfo, and routes to the appropriate generator.
 */

import jsPDF from 'jspdf';
import type { HeaderConfig, FooterConfig } from '../config/types';
import { getCatalogPreset } from '../config/compositionCatalog';
import { getPreset } from '../config/formatPresets';
import { structureToDrawData, findStructure } from '../core/drawsDataToDrawData';
import type { DrawData } from '../core/extractDrawData';
import type { ConsolationStructure } from '../renderers/consolationDraw';
import type { DoubleEliminationData } from '../renderers/doubleEliminationDraw';
import {
  generateTraditionalDrawPDF,
  generateSplitDrawPDF,
  generateConsolationDrawPDF,
  generateDoubleEliminationPDF,
  generateMirroredDrawPDF,
} from './drawPDF';
import { createDoc } from '../composition/page';

export interface GenerateFromEventDataOptions {
  catalogPreset?: string;
  headerOverrides?: Partial<HeaderConfig>;
  footerOverrides?: Partial<FooterConfig>;
  structureId?: string;
  splitPages?: boolean;
  maxPositionsPerPage?: number;
  mirrored?: boolean;
}

export function generateFromEventData(eventData: any, options: GenerateFromEventDataOptions = {}): jsPDF {
  const drawsData = eventData?.drawsData || [];
  const tournamentInfo = eventData?.tournamentInfo || {};
  const eventInfo = eventData?.eventInfo || {};

  // Resolve catalog preset
  const preset = getCatalogPreset(options.catalogPreset || 'club-basic');
  const drawFormat = getPreset(preset?.drawFormatPreset || 'itfJunior');

  // Build header config from tournament/event info + catalog + overrides
  const header: HeaderConfig = {
    layout: 'itf',
    tournamentName: tournamentInfo.tournamentName || 'Tournament',
    ...preset?.header,
    subtitle: eventInfo.eventName || preset?.header?.subtitle,
    startDate: tournamentInfo.startDate,
    endDate: tournamentInfo.endDate,
    location: tournamentInfo.venues?.[0]?.venueName,
    city: tournamentInfo.venues?.[0]?.city,
    country: tournamentInfo.hostCountryCode,
    surface: eventInfo.surfaceCategory,
    ...options.headerOverrides,
  };

  // Build footer config from catalog + overrides
  const footer: FooterConfig = {
    layout: 'standard',
    showPageNumbers: true,
    showTimestamp: true,
    ...preset?.footer,
    ...options.footerOverrides,
  };

  // Detect draw type from structures
  const structures = drawsData?.[0]?.structures || [];
  const hasConsolation = structures.some((s: any) => s.stage === 'CONSOLATION');
  const hasPlayOff = structures.some((s: any) => s.stage === 'PLAY_OFF');
  const mainStruct = structures.find((s: any) => s.stage === 'MAIN');

  const pdfOpts = { header, footer, format: drawFormat };

  // Double elimination: MAIN + CONSOLATION + PLAY_OFF
  if (hasConsolation && hasPlayOff) {
    const data: DoubleEliminationData = {
      winnersBracket: mainStruct ? structureToDrawData(mainStruct) : emptyDrawData(),
      losersBracket: findStructure(drawsData, 'CONSOLATION')
        ? structureToDrawData(findStructure(drawsData, 'CONSOLATION'))
        : emptyDrawData(),
      deciderMatch: findStructure(drawsData, 'PLAY_OFF')
        ? structureToDrawData(findStructure(drawsData, 'PLAY_OFF'))
        : undefined,
    };
    return generateDoubleEliminationPDF(data, pdfOpts);
  }

  // Consolation: MAIN + CONSOLATION (no PLAY_OFF)
  if (hasConsolation) {
    const consolStructures: ConsolationStructure[] = structures.map((s: any) => ({
      name: s.structureName,
      stage: s.stage,
      drawData: structureToDrawData(s),
    }));
    return generateConsolationDrawPDF(consolStructures, pdfOpts);
  }

  // Single structure — determine which renderer
  const targetStruct = options.structureId
    ? structures.find((s: any) => s.structureId === options.structureId) || mainStruct
    : mainStruct;

  if (!targetStruct) {
    return createDoc({
      pageSize: 'a4',
      orientation: 'portrait',
      margins: { top: 12, right: 15, bottom: 12, left: 15 },
    });
  }

  const drawData = structureToDrawData(targetStruct);

  // Mirrored bracket
  if (options.mirrored) {
    return generateMirroredDrawPDF(drawData, pdfOpts);
  }

  // Split pages
  if (options.splitPages || drawData.drawSize >= 256) {
    return generateSplitDrawPDF(drawData, { ...pdfOpts, maxPositionsPerPage: options.maxPositionsPerPage || 32 });
  }

  // Feed-in detection (done inside generateTraditionalDrawPDF via detectFeedStructure)
  return generateTraditionalDrawPDF(drawData, pdfOpts);
}

function emptyDrawData(): DrawData {
  return { drawName: '', drawSize: 0, drawType: '', totalRounds: 0, slots: [], matchUps: [], seedAssignments: [] };
}
