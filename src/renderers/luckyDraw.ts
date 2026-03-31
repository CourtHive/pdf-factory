import jsPDF from 'jspdf';
import type { PageRegions, DrawFormatConfig } from '../config/types';
import type { DrawData, DrawMatchUp } from '../core/extractDrawData';
import { getRoundLabel } from '../core/extractDrawData';
import { formatPlayerEntry, formatMatchScore } from './formatEntry';
import { setFont, SIZE, STYLE } from '../layout/fonts';

const BOX_INNER_PAD = 1;
const PREFERRED_BOX_HEIGHT = 16;
const MIN_BOX_GAP = 1;

export function renderLuckyDraw(doc: jsPDF, drawData: DrawData, format: DrawFormatConfig, regions: PageRegions): void {
  const margins = format.page.margins;

  // Group matchUps by round
  const roundMap = new Map<number, DrawMatchUp[]>();
  for (const mu of drawData.matchUps) {
    if (!roundMap.has(mu.roundNumber)) roundMap.set(mu.roundNumber, []);
    roundMap.get(mu.roundNumber)!.push(mu);
  }

  const slotMap = new Map(drawData.slots.map((s) => [s.drawPosition, s]));
  const sortedRounds = [...roundMap.keys()].sort((a, b) => a - b);
  const totalRounds = sortedRounds.length;

  // Layout: vertical columns, left to right
  const headerReserve = 7;
  const contentTop = regions.contentY + headerReserve;
  const contentHeight = regions.contentHeight - headerReserve;
  const roundGap = 6;
  const boxWidth = Math.min(55, (regions.contentWidth - (totalRounds - 1) * roundGap) / totalRounds);

  // Scale box height to fit the largest round (R1) with minimum gaps
  const maxMatchesInRound = roundMap.get(sortedRounds[0])?.length || 1;
  const boxHeight = Math.min(
    PREFERRED_BOX_HEIGHT,
    (contentHeight - (maxMatchesInRound + 1) * MIN_BOX_GAP) / maxMatchesInRound,
  );

  // Round headers
  setFont(doc, SIZE.SMALL, STYLE.BOLD);
  doc.setTextColor(30, 60, 120);
  for (let ri = 0; ri < totalRounds; ri++) {
    const roundNum = sortedRounds[ri];
    const label =
      format.roundLabels[getRoundLabel(roundNum, drawData.totalRounds)] ||
      getRoundLabel(roundNum, drawData.totalRounds);
    const colX = margins.left + ri * (boxWidth + roundGap);
    doc.text(label, colX + boxWidth / 2, regions.contentY + 3, { align: 'center' });
  }
  doc.setTextColor(0);

  // Render each round column
  for (let ri = 0; ri < totalRounds; ri++) {
    const roundNum = sortedRounds[ri];
    const matchUps = roundMap.get(roundNum) || [];
    const count = matchUps.length;
    const colX = margins.left + ri * (boxWidth + roundGap);

    // Space-around: evenly distribute boxes vertically
    const totalBoxHeight = count * boxHeight;
    const gap = count > 1 ? (contentHeight - totalBoxHeight) / (count + 1) : (contentHeight - boxHeight) / 2;

    for (let i = 0; i < count; i++) {
      const y = contentTop + gap + i * (boxHeight + gap);
      renderMatchBox(doc, matchUps[i], slotMap, format, colX, y, boxWidth, boxHeight);
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
  width: number,
  height: number,
): void {
  const isCompact = height < 10;
  const fontSize = isCompact ? 5 : SIZE.TINY;

  // Box outline
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);

  // Divider line in middle
  const midY = y + height / 2;
  doc.setLineWidth(0.15);
  doc.line(x, midY, x + width, midY);

  // Side 1 (top half)
  const slot1 = mu.drawPositions[0] ? slotMap.get(mu.drawPositions[0]) : undefined;
  if (slot1) {
    const text = formatPlayerEntry(slot1, format);
    const isWinner = mu.winningSide === 1;
    setFont(doc, fontSize, isWinner ? STYLE.BOLD : STYLE.NORMAL);
    doc.text(text, x + BOX_INNER_PAD, midY - fontSize * 0.15, { maxWidth: width - 2 * BOX_INNER_PAD });
  }

  // Side 2 (bottom half)
  const slot2 = mu.drawPositions[1] ? slotMap.get(mu.drawPositions[1]) : undefined;
  if (slot2) {
    const text = formatPlayerEntry(slot2, format);
    const isWinner = mu.winningSide === 2;
    setFont(doc, fontSize, isWinner ? STYLE.BOLD : STYLE.NORMAL);
    doc.text(text, x + BOX_INNER_PAD, midY + fontSize * 0.55, { maxWidth: width - 2 * BOX_INNER_PAD });
  }

  // Score (top right corner)
  if (mu.score) {
    const scoreStr = formatMatchScore(mu.score, format);
    setFont(doc, fontSize, STYLE.NORMAL);
    doc.setTextColor(60, 60, 160);
    doc.text(scoreStr, x + width - BOX_INNER_PAD, y + fontSize * 0.5, { align: 'right' });
    doc.setTextColor(0);
  }
}
