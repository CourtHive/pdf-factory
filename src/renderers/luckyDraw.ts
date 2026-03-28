import jsPDF from 'jspdf';
import type { PageRegions, DrawFormatConfig } from '../config/types';
import type { DrawData, DrawMatchUp } from '../core/extractDrawData';
import { getRoundLabel } from '../core/extractDrawData';
import { formatPlayerEntry, formatMatchScore } from './formatEntry';
import { setFont, SIZE, STYLE } from '../layout/fonts';

const BOX_WIDTH = 55;
const BOX_HEIGHT = 16;
const BOX_GAP_H = 6;
const BOX_GAP_V = 4;

export function renderLuckyDraw(doc: jsPDF, drawData: DrawData, format: DrawFormatConfig, regions: PageRegions): void {
  const margins = format.page.margins;
  let y = regions.contentY + 4;

  // Group matchUps by round
  const roundMap = new Map<number, DrawMatchUp[]>();
  for (const mu of drawData.matchUps) {
    if (!roundMap.has(mu.roundNumber)) roundMap.set(mu.roundNumber, []);
    roundMap.get(mu.roundNumber)!.push(mu);
  }

  const slotMap = new Map(drawData.slots.map((s) => [s.drawPosition, s]));
  const sortedRounds = [...roundMap.keys()].sort((a, b) => a - b);

  for (const roundNum of sortedRounds) {
    const matchUps = roundMap.get(roundNum) || [];
    const label =
      format.roundLabels[getRoundLabel(roundNum, drawData.totalRounds)] ||
      getRoundLabel(roundNum, drawData.totalRounds);

    // Round header
    setFont(doc, SIZE.BODY, STYLE.BOLD);
    doc.setTextColor(30, 60, 120);
    doc.text(label, margins.left, y);
    doc.setTextColor(0);
    y += 4;

    // Lay out match boxes in a grid
    const maxPerRow = Math.floor(regions.contentWidth / (BOX_WIDTH + BOX_GAP_H));
    let col = 0;

    for (const mu of matchUps) {
      // Check if we need a new row
      if (col >= maxPerRow) {
        col = 0;
        y += BOX_HEIGHT + BOX_GAP_V;
      }

      const currentX = margins.left + col * (BOX_WIDTH + BOX_GAP_H);
      renderMatchBox(doc, mu, slotMap, format, currentX, y);
      col++;
    }

    y += BOX_HEIGHT + BOX_GAP_V + 2;

    // Check page overflow
    if (y > regions.contentY + regions.contentHeight - BOX_HEIGHT) {
      doc.addPage();
      y = regions.contentY + 4;
    }
  }
}

function renderMatchBox(
  doc: jsPDF,
  mu: DrawMatchUp,
  slotMap: Map<number, any>,
  format: DrawFormatConfig,
  x: number,
  y: number,
): void {
  // Box outline
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.rect(x, y, BOX_WIDTH, BOX_HEIGHT);

  // Divider line in middle
  const midY = y + BOX_HEIGHT / 2;
  doc.setLineWidth(0.15);
  doc.line(x, midY, x + BOX_WIDTH, midY);

  // Side 1 (top half)
  const slot1 = mu.drawPositions[0] ? slotMap.get(mu.drawPositions[0]) : undefined;
  if (slot1) {
    const text = formatPlayerEntry(slot1, format);
    const isWinner = mu.winningSide === 1;
    setFont(doc, SIZE.TINY, isWinner ? STYLE.BOLD : STYLE.NORMAL);
    doc.text(text, x + 1, midY - 2, { maxWidth: BOX_WIDTH - 2 });
  }

  // Side 2 (bottom half)
  const slot2 = mu.drawPositions[1] ? slotMap.get(mu.drawPositions[1]) : undefined;
  if (slot2) {
    const text = formatPlayerEntry(slot2, format);
    const isWinner = mu.winningSide === 2;
    setFont(doc, SIZE.TINY, isWinner ? STYLE.BOLD : STYLE.NORMAL);
    doc.text(text, x + 1, midY + 4, { maxWidth: BOX_WIDTH - 2 });
  }

  // Score (top right corner)
  if (mu.score) {
    const scoreStr = formatMatchScore(mu.score, format);
    setFont(doc, SIZE.TINY, STYLE.NORMAL);
    doc.setTextColor(60, 60, 160);
    doc.text(scoreStr, x + BOX_WIDTH - 1, y + 3, { align: 'right' });
    doc.setTextColor(0);
  }
}
