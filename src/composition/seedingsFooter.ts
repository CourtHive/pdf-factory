/**
 * Seeded players table for draw sheet footers.
 *
 * Renders a compact multi-column list of seeded players,
 * similar to what appears at the bottom of WTA/ITF/Grand Slam draw sheets.
 */

import jsPDF from 'jspdf';
import type { DrawFormatConfig } from '../config/types';
import type { DrawData } from '../core/extractDrawData';
import { setFont, STYLE } from '../layout/fonts';

const SEED_FONT_SIZE = 5;
const SEED_LINE_HEIGHT = 2.5;

export function renderSeedingsFooter(doc: jsPDF, drawData: DrawData, format: DrawFormatConfig, startY: number): number {
  const seeds = drawData.seedAssignments;
  if (!seeds.length) return startY;

  const margins = format.page.margins;
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = pageWidth - margins.left - margins.right;

  // Title
  setFont(doc, SEED_FONT_SIZE + 1, STYLE.BOLD);
  doc.text('Seeded players', margins.left, startY);

  // Separator line
  doc.setDrawColor(150);
  doc.setLineWidth(0.15);
  doc.line(margins.left, startY + 1, margins.left + availableWidth * 0.5, startY + 1);
  startY += 3;

  // Split seeds into 2 columns
  const half = Math.ceil(seeds.length / 2);
  const col1 = seeds.slice(0, half);
  const col2 = seeds.slice(half);
  const colWidth = availableWidth * 0.25;

  let y = startY;
  for (let i = 0; i < Math.max(col1.length, col2.length); i++) {
    if (col1[i]) {
      renderSeedEntry(doc, col1[i], margins.left, y, colWidth);
    }
    if (col2[i]) {
      renderSeedEntry(doc, col2[i], margins.left + colWidth + 4, y, colWidth);
    }
    y += SEED_LINE_HEIGHT;
  }

  return y;
}

function renderSeedEntry(
  doc: jsPDF,
  seed: { seedValue: number; participantName: string; nationality: string },
  x: number,
  y: number,
  _maxWidth: number,
): void {
  setFont(doc, SEED_FONT_SIZE, STYLE.BOLD);
  doc.text(`${seed.seedValue}`, x + 4, y, { align: 'right' });

  setFont(doc, SEED_FONT_SIZE, STYLE.NORMAL);
  doc.text(seed.participantName, x + 6, y);

  doc.setTextColor(100);
  doc.text(seed.nationality, x + 45, y);
  doc.setTextColor(0);
}

export function measureSeedingsHeight(seedCount: number): number {
  if (seedCount === 0) return 0;
  const rows = Math.ceil(seedCount / 2);
  return 4 + rows * SEED_LINE_HEIGHT;
}
