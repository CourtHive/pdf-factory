/**
 * Composable draw PDF generator.
 *
 * Accepts DrawData + composition options and produces a complete, paginated PDF
 * with headers on every page, footers on every page, and automatic orientation.
 *
 * Supports: traditional single-elimination, feed-in, consolation (multi-structure),
 * compass, double elimination, lucky draw, round robin.
 */

import jsPDF from 'jspdf';
import type { HeaderConfig, FooterConfig, PageConfig } from '../config/types';
import type { DrawFormatConfig } from '../config/types';
import type { DrawData, DrawMatchUp } from '../core/extractDrawData';
import type { CompassDrawData } from '../core/extractCompassData';
import type { ConsolationStructure } from '../renderers/consolationDraw';
import type { DoubleEliminationData } from '../renderers/doubleEliminationDraw';
import { renderTraditionalDraw } from '../renderers/traditionalDraw';
import { renderCompassDraw } from '../renderers/compassDraw';
import { renderConsolationDraw } from '../renderers/consolationDraw';
import { renderDoubleEliminationDraw } from '../renderers/doubleEliminationDraw';
import { renderLuckyDraw } from '../renderers/luckyDraw';
import { createDoc, getPageRegions } from '../composition/page';
import { renderHeader } from '../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../composition/footerLayouts';
import { getPreset } from '../config/formatPresets';
import { splitDraw } from '../renderers/drawSplitter';

export interface DrawPDFOptions {
  header?: HeaderConfig;
  footer?: FooterConfig;
  page?: Partial<PageConfig>;
  preset?: string;
  format?: DrawFormatConfig;
}

/**
 * Smart entry point for TMX integration.
 *
 * Accepts DrawData and auto-detects the draw type to route to the correct renderer.
 * TMX callers can use getEventData() output directly — the generator inspects
 * matchUp patterns, structure count, and drawType to choose the layout.
 *
 * Header/footer configs come from provider defaults; tournament directors can override.
 */
export function generateDrawPDF(drawData: DrawData, options: DrawPDFOptions = {}): jsPDF {
  // Detect feed structure
  if (detectFeedStructure(drawData.matchUps)) {
    return generateFeedInDrawPDF(drawData, options);
  }

  // Standard single-elimination
  return generateTraditionalDrawPDF(drawData, options);
}

function detectFeedStructure(matchUps: DrawMatchUp[]): boolean {
  const roundCounts = new Map<number, number>();
  for (const mu of matchUps) {
    roundCounts.set(mu.roundNumber, (roundCounts.get(mu.roundNumber) || 0) + 1);
  }
  const rounds = [...roundCounts.keys()].sort((a, b) => a - b);
  for (let i = 1; i < rounds.length; i++) {
    const prev = roundCounts.get(rounds[i - 1]) || 0;
    const curr = roundCounts.get(rounds[i]) || 0;
    if (curr >= prev) return true;
  }
  return false;
}

interface PageChrome {
  doc: jsPDF;
  pageConfig: PageConfig;
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
  format: DrawFormatConfig;
  headerH: number;
  footerH: number;
}

// ---- Public API ----

export function generateTraditionalDrawPDF(drawData: DrawData, options: DrawPDFOptions = {}): jsPDF {
  // 256+ draws must always be split — too dense for single-page rendering
  if (drawData.drawSize >= 256) {
    return generateSplitDrawPDF(drawData, { ...options, maxPositionsPerPage: 64 });
  }

  const chrome = initChrome(drawData.drawSize, options);
  const regions = getPageRegions(chrome.doc, chrome.pageConfig, chrome.headerH, chrome.footerH);

  renderTraditionalDraw(chrome.doc, drawData, chrome.format, regions);
  finalizePages(chrome);
  return chrome.doc;
}

export function generateSplitDrawPDF(
  drawData: DrawData,
  options: DrawPDFOptions & { maxPositionsPerPage?: number } = {},
): jsPDF {
  const chrome = initChrome(drawData.drawSize, options);
  const maxPerPage = options.maxPositionsPerPage || 32;
  const segments = splitDraw(drawData, {
    maxPositionsPerPage: maxPerPage,
    includeOverlapRounds: true,
    summaryPage: true,
  });

  for (let i = 0; i < segments.length; i++) {
    if (i > 0) chrome.doc.addPage();

    const headerH = renderHeader(
      chrome.doc,
      { ...chrome.headerConfig, subtitle: segments[i].label },
      chrome.pageConfig,
    );
    const regions = getPageRegions(chrome.doc, chrome.pageConfig, headerH, chrome.footerH);

    if (segments[i].slots.length > 0 || segments[i].matchUps.length > 0) {
      const seg = segments[i];
      const segDrawSize = seg.endPosition - seg.startPosition + 1;
      const segData: DrawData = {
        ...drawData,
        slots: seg.slots,
        matchUps: seg.matchUps,
        noWinnerColumn: seg.noWinnerColumn,
        roundLabelMap: seg.roundLabelMap || drawData.roundLabelMap,
        drawSize: segDrawSize,
        totalRounds: seg.segmentRounds,
      };
      renderTraditionalDraw(chrome.doc, segData, chrome.format, regions, seg.startPosition - 1, segDrawSize);
    }
  }

  finalizePages(chrome);
  return chrome.doc;
}

export function generateFeedInDrawPDF(drawData: DrawData, options: DrawPDFOptions = {}): jsPDF {
  const needsLandscape = drawData.totalRounds >= 5 || drawData.slots.length >= 12;
  const chrome = initChrome(drawData.drawSize, options, needsLandscape);
  const regions = getPageRegions(chrome.doc, chrome.pageConfig, chrome.headerH, chrome.footerH);

  renderTraditionalDraw(chrome.doc, drawData, chrome.format, regions);
  finalizePages(chrome);
  return chrome.doc;
}

export function generateConsolationDrawPDF(structures: ConsolationStructure[], options: DrawPDFOptions = {}): jsPDF {
  const maxSize = Math.max(...structures.map((s) => s.drawData.drawSize), 8);
  const chrome = initChrome(maxSize, options);
  const regions = getPageRegions(chrome.doc, chrome.pageConfig, chrome.headerH, chrome.footerH);

  renderConsolationDraw(chrome.doc, structures, chrome.format, regions);
  // Consolation renderer may add pages — render header on any new pages
  renderHeadersOnNewPages(chrome, 1);
  finalizePages(chrome);
  return chrome.doc;
}

export function generateCompassDrawPDF(compassData: CompassDrawData, options: DrawPDFOptions = {}): jsPDF {
  const mainSize = compassData.mainStructure?.drawSize || 8;
  const chrome = initChrome(mainSize, options);
  const regions = getPageRegions(chrome.doc, chrome.pageConfig, chrome.headerH, chrome.footerH);

  renderCompassDraw(chrome.doc, compassData, chrome.format, regions);
  // Compass renderer may add pages — render header on any new pages
  renderHeadersOnNewPages(chrome, 1);
  finalizePages(chrome);
  return chrome.doc;
}

export function generateDoubleEliminationPDF(data: DoubleEliminationData, options: DrawPDFOptions = {}): jsPDF {
  const size = Math.max(data.winnersBracket.drawSize, data.losersBracket.drawSize, 8);
  const chrome = initChrome(size, options, true);
  const regions = getPageRegions(chrome.doc, chrome.pageConfig, chrome.headerH, chrome.footerH);

  renderDoubleEliminationDraw(chrome.doc, data, chrome.format, regions);
  finalizePages(chrome);
  return chrome.doc;
}

export function generateLuckyDrawPDF(drawData: DrawData, options: DrawPDFOptions = {}): jsPDF {
  const chrome = initChrome(drawData.drawSize, options);
  const regions = getPageRegions(chrome.doc, chrome.pageConfig, chrome.headerH, chrome.footerH);

  renderLuckyDraw(chrome.doc, drawData, chrome.format, regions);
  finalizePages(chrome);
  return chrome.doc;
}

// ---- Internal helpers ----

function initChrome(drawSize: number, options: DrawPDFOptions, forceLandscape?: boolean): PageChrome {
  const format = options.format || getPreset(options.preset || 'itfJunior');
  const pageConfig: PageConfig = {
    ...format.page,
    ...options.page,
    orientation: forceLandscape ? 'landscape' : options.page?.orientation || format.page.orientation,
  };

  const headerConfig: HeaderConfig = options.header || { layout: 'none', tournamentName: '' };
  const footerConfig: FooterConfig = options.footer || {
    layout: 'standard',
    showPageNumbers: true,
    showTimestamp: true,
  };

  const doc = createDoc(pageConfig, drawSize);
  const footerH = measureFooterHeight(footerConfig);
  const headerH = renderHeader(doc, headerConfig, pageConfig);

  return { doc, pageConfig, headerConfig, footerConfig, format, headerH, footerH };
}

/** Render header on any pages added after the initial page (page 1 already has one) */
function renderHeadersOnNewPages(chrome: PageChrome, firstPageCount: number): void {
  const totalPages = chrome.doc.getNumberOfPages();
  for (let p = firstPageCount + 1; p <= totalPages; p++) {
    chrome.doc.setPage(p);
    renderHeader(chrome.doc, chrome.headerConfig, chrome.pageConfig);
  }
}

/** Render footer on every page with correct page numbers */
function finalizePages(chrome: PageChrome): void {
  const totalPages = chrome.doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    chrome.doc.setPage(p);
    renderFooter(chrome.doc, chrome.footerConfig, chrome.pageConfig, p);
  }
  // Ensure we end on the last page
  chrome.doc.setPage(totalPages);
}
