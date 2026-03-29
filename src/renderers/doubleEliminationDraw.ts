/**
 * Double elimination draw renderer.
 *
 * Layout: Winner's bracket (top) + Loser's bracket (bottom) + Championship match (right).
 * Both brackets flow left-to-right like standard single elimination.
 *
 * The factory's DOUBLE_ELIMINATION draw type produces two structures:
 * - Main structure (winner's bracket)
 * - Consolation structure (loser's bracket)
 *
 * This renderer reuses the traditional draw renderer for each bracket
 * and adds section labels and a championship match connector.
 */

import jsPDF from 'jspdf';
import type { DrawFormatConfig, PageRegions } from '../config/types';
import type { DrawData } from '../core/extractDrawData';
import { renderTraditionalDraw } from './traditionalDraw';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface DoubleEliminationData {
  winnersBracket: DrawData;
  losersBracket: DrawData;
  championshipMatch?: {
    winnerOfWinners?: string;
    winnerOfLosers?: string;
    score?: string;
  };
}

export function renderDoubleEliminationDraw(
  doc: jsPDF,
  data: DoubleEliminationData,
  format: DrawFormatConfig,
  regions: PageRegions,
): void {
  const margins = format.page.margins;
  const totalHeight = regions.contentHeight;

  // Winner's bracket gets ~45% of the space, loser's bracket ~45%, championship ~10%
  const winnersHeight = totalHeight * 0.42;
  const losersHeight = totalHeight * 0.42;

  // Winner's bracket header
  let y = regions.contentY;
  setFont(doc, SIZE.BODY, STYLE.BOLD);
  doc.setTextColor(30, 80, 30);
  doc.text("Winner's Bracket", margins.left, y);
  doc.setTextColor(0);
  y += 3;

  // Thin separator
  doc.setDrawColor(30, 80, 30);
  doc.setLineWidth(0.4);
  doc.line(margins.left, y, margins.left + 35, y);
  y += 2;

  // Render winner's bracket
  const winnersRegions: PageRegions = {
    ...regions,
    contentY: y,
    contentHeight: winnersHeight - 7,
  };
  renderTraditionalDraw(doc, data.winnersBracket, format, winnersRegions);

  // Loser's bracket header
  y = regions.contentY + winnersHeight + 4;
  setFont(doc, SIZE.BODY, STYLE.BOLD);
  doc.setTextColor(140, 40, 40);
  doc.text("Loser's Bracket", margins.left, y);
  doc.setTextColor(0);
  y += 3;

  doc.setDrawColor(140, 40, 40);
  doc.setLineWidth(0.4);
  doc.line(margins.left, y, margins.left + 35, y);
  y += 2;

  // Render loser's bracket
  const losersRegions: PageRegions = {
    ...regions,
    contentY: y,
    contentHeight: losersHeight - 7,
  };
  renderTraditionalDraw(doc, data.losersBracket, format, losersRegions);

  // Championship match (if data provided)
  if (data.championshipMatch) {
    const champX = regions.pageWidth - margins.right - 30;
    const champY = regions.contentY + totalHeight / 2;

    setFont(doc, SIZE.SMALL, STYLE.BOLD);
    doc.text('Championship', champX, champY - 8, { align: 'center' });

    // Dashed box for "if necessary" match
    doc.setDrawColor(100);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1], 0);
    doc.rect(champX - 15, champY - 5, 30, 12);
    doc.setLineDashPattern([], 0);

    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(100);
    doc.text('If first loss', champX, champY + 10, { align: 'center' });
    doc.setTextColor(0);
  }
}
