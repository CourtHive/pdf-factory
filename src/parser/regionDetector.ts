/**
 * Detect header, content, and footer regions of a PDF page.
 *
 * Uses text density analysis and line detection to identify page structure.
 * Critical for PDF-to-TODS extraction: knowing where the draw bracket starts
 * and ends determines what text is player data vs. metadata.
 */

import type { TextItem, PdfLine, PdfPage } from './pdfExtractor';
import { clusterCoordinates, type ClusterRange } from './coordinateClustering';

export interface PageRegion {
  yMin: number;
  yMax: number;
  items: TextItem[];
}

export interface DetectedRegions {
  header: PageRegion;
  content: PageRegion;
  footer: PageRegion;
  rowClusters: ClusterRange[];
  columnClusters: ClusterRange[];
}

export function detectRegions(page: PdfPage, tolerance: number = 0.3): DetectedRegions {
  const { texts, hLines } = page;
  if (!texts.length) return emptyRegions();

  // Cluster text y-coordinates into logical rows
  const yCoords = texts.map((t) => t.y);
  const rowClusters = clusterCoordinates(yCoords, tolerance);

  // Cluster x-coordinates into logical columns
  const xCoords = texts.map((t) => t.x);
  const columnClusters = clusterCoordinates(xCoords, tolerance);

  // Find major horizontal lines that likely separate regions
  const significantLines = hLines.filter((l) => l.length > page.width * 0.3).sort((a, b) => a.y - b.y);

  // Heuristic: header is the top ~15% of the page, footer is bottom ~10%
  const headerBoundary = findHeaderBoundary(rowClusters, significantLines, page.height);
  const footerBoundary = findFooterBoundary(rowClusters, significantLines, page.height);

  const header: PageRegion = {
    yMin: 0,
    yMax: headerBoundary,
    items: texts.filter((t) => t.y <= headerBoundary),
  };

  const footer: PageRegion = {
    yMin: footerBoundary,
    yMax: page.height,
    items: texts.filter((t) => t.y >= footerBoundary),
  };

  const content: PageRegion = {
    yMin: headerBoundary,
    yMax: footerBoundary,
    items: texts.filter((t) => t.y > headerBoundary && t.y < footerBoundary),
  };

  return { header, content, footer, rowClusters, columnClusters };
}

function findHeaderBoundary(rows: ClusterRange[], lines: PdfLine[], pageHeight: number): number {
  // Look for a horizontal line in the top 25% of the page
  const topLine = lines.find((l) => l.y < pageHeight * 0.25 && l.y > pageHeight * 0.05);
  if (topLine) return topLine.y;

  // Fallback: find a gap in row clusters in the top 20%
  const topRows = rows.filter((r) => r.center < pageHeight * 0.2);
  if (topRows.length >= 2) {
    let maxGap = 0;
    let gapY = pageHeight * 0.15;
    for (let i = 1; i < topRows.length; i++) {
      const gap = topRows[i].min - topRows[i - 1].max;
      if (gap > maxGap) {
        maxGap = gap;
        gapY = (topRows[i - 1].max + topRows[i].min) / 2;
      }
    }
    if (maxGap > 0.5) return gapY;
  }

  return pageHeight * 0.12;
}

function findFooterBoundary(rows: ClusterRange[], lines: PdfLine[], pageHeight: number): number {
  // Look for a horizontal line in the bottom 25% of the page
  const bottomLine = [...lines].reverse().find((l) => l.y > pageHeight * 0.75 && l.y < pageHeight * 0.95);
  if (bottomLine) return bottomLine.y;

  // Fallback: find the last content cluster before the bottom
  const bottomRows = rows.filter((r) => r.center > pageHeight * 0.8);
  if (bottomRows.length >= 2) {
    let maxGap = 0;
    let gapY = pageHeight * 0.88;
    for (let i = 1; i < bottomRows.length; i++) {
      const gap = bottomRows[i].min - bottomRows[i - 1].max;
      if (gap > maxGap) {
        maxGap = gap;
        gapY = (bottomRows[i - 1].max + bottomRows[i].min) / 2;
      }
    }
    if (maxGap > 0.5) return gapY;
  }

  return pageHeight * 0.88;
}

function emptyRegions(): DetectedRegions {
  const empty: PageRegion = { yMin: 0, yMax: 0, items: [] };
  return { header: empty, content: empty, footer: empty, rowClusters: [], columnClusters: [] };
}
