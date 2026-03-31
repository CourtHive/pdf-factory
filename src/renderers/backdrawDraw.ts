/**
 * Backdraw (USTA Playback) renderer.
 *
 * First Round in the center, main draw progresses RIGHT,
 * consolation (playback) progresses LEFT. Landscape only.
 * Used for FIRST_ROUND_LOSER_CONSOLATION with drawSize ≤ 32.
 *
 * Layout:
 *   [Consol Finals] ... [Consol R1] | [First Round boxes] | [Main R2] ... [Main Finals]
 *                   ←  Playback     |     First Round      |    Main Draw  →
 */

import jsPDF from 'jspdf';
import type { DrawFormatConfig, PageRegions } from '../config/types';
import type { DrawData, DrawSlot, DrawMatchUp } from '../core/extractDrawData';
import { formatPlayerEntrySplit, formatMatchScore } from './formatEntry';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface BackdrawData {
  mainDraw: DrawData;
  consolation: DrawData;
}

export function renderBackdrawDraw(
  doc: jsPDF,
  data: BackdrawData,
  format: DrawFormatConfig,
  regions: PageRegions,
): void {
  const margins = format.page.margins;
  const headerReserve = 9;
  const contentTop = regions.contentY + headerReserve;
  const contentHeight = regions.contentHeight - headerReserve;
  const totalWidth = regions.contentWidth;

  const mainMatchUps = data.mainDraw.matchUps;
  const mainSlots = data.mainDraw.slots;
  const consolMatchUps = data.consolation.matchUps;
  const consolSlots = data.consolation.slots;

  const mainSlotMap = new Map(mainSlots.map((s) => [s.drawPosition, s]));
  const consolSlotMap = new Map(consolSlots.map((s) => [s.drawPosition, s]));

  // R1 of main has the most matches — determines the center column height
  const r1Matches = mainMatchUps.filter((mu) => mu.roundNumber === 1).sort((a, b) => a.roundPosition - b.roundPosition);
  const r1Count = r1Matches.length;
  const drawSize = r1Count * 2;

  // Main has R1..Rn, consolation has R1..Rm
  const mainRounds = Math.max(...mainMatchUps.map((m) => m.roundNumber));
  const mainLaterRounds = mainRounds - 1; // rounds after R1 (progressing right)
  const consolRounds = consolMatchUps.length > 0 ? Math.max(...consolMatchUps.map((m) => m.roundNumber)) : 0;

  // Layout widths
  const centerBoxWidth = 28;
  const connectorGap = 1.5;
  const remainingWidth = totalWidth - centerBoxWidth - connectorGap * 4;

  // Right: main R2..Rn + winner column = mainLaterRounds + 1 columns
  const rightCols = mainLaterRounds + 1;
  // Left: consolation R1..Rn + winner column = consolRounds + 1 columns
  const leftCols = Math.max(consolRounds + 1, 1);

  const rightWidth = remainingWidth * (rightCols / (rightCols + leftCols));
  const leftWidth = remainingWidth - rightWidth;
  const centerX = margins.left + leftWidth + connectorGap;

  const rightColWidth = rightCols > 0 ? (rightWidth - connectorGap * rightCols) / rightCols : 0;
  const rightStartX = centerX + centerBoxWidth + connectorGap;

  const leftColWidth = leftCols > 0 ? (leftWidth - connectorGap * leftCols) / leftCols : 0;
  const leftEdgeX = margins.left + leftWidth;

  // Vertical spacing
  const lineHeight = contentHeight / drawSize;
  const isDense = lineHeight < 3.5;
  let fontSize = SIZE.SMALL;
  if (lineHeight < 2.5) fontSize = 5;
  else if (isDense) fontSize = SIZE.TINY;
  const scoreFontSize = isDense ? 5 : SIZE.TINY;

  // Round headers
  renderBackdrawHeaders(
    doc,
    mainRounds,
    consolRounds,
    data,
    format,
    centerX,
    centerBoxWidth,
    rightStartX,
    rightColWidth,
    leftEdgeX,
    leftColWidth,
    connectorGap,
    regions.contentY + 2,
    fontSize,
  );

  // ---- Center: First Round boxes ----
  for (let i = 0; i < r1Count; i++) {
    const mu = r1Matches[i];
    const topY = contentTop + i * lineHeight * 2;
    const bottomY = topY + lineHeight;
    const midY = (topY + bottomY) / 2;
    const dp1 = mu.drawPositions[0];
    const dp2 = mu.drawPositions[1];

    // Draw boxes
    const boxH = lineHeight * 0.9;
    doc.setDrawColor(40);
    doc.setLineWidth(0.3);
    doc.rect(centerX, topY, centerBoxWidth, boxH);
    doc.rect(centerX, bottomY, centerBoxWidth, boxH);

    // Position numbers and names
    const slot1 = dp1 ? mainSlotMap.get(dp1) : undefined;
    const slot2 = dp2 ? mainSlotMap.get(dp2) : undefined;

    setFont(doc, fontSize, STYLE.NORMAL);
    if (dp1) {
      doc.setTextColor(120);
      doc.text(`${dp1}`, centerX + 1, topY + boxH / 2 + fontSize * 0.12);
      doc.setTextColor(0);
      if (slot1?.participantName) {
        const name = abbreviateName(slot1.participantName);
        setFont(doc, fontSize, mu.winningSide === 1 ? STYLE.BOLD : STYLE.NORMAL);
        doc.text(name, centerX + 5, topY + boxH / 2 + fontSize * 0.12, { maxWidth: centerBoxWidth - 6 });
      }
    }
    if (dp2) {
      doc.setTextColor(120);
      setFont(doc, fontSize, STYLE.NORMAL);
      doc.text(`${dp2}`, centerX + 1, bottomY + boxH / 2 + fontSize * 0.12);
      doc.setTextColor(0);
      if (slot2?.participantName) {
        const name = abbreviateName(slot2.participantName);
        setFont(doc, fontSize, mu.winningSide === 2 ? STYLE.BOLD : STYLE.NORMAL);
        doc.text(name, centerX + 5, bottomY + boxH / 2 + fontSize * 0.12, { maxWidth: centerBoxWidth - 6 });
      }
    }

    // Right connector from center to main R2
    doc.setDrawColor(40);
    doc.setLineWidth(0.25);
    doc.line(centerX + centerBoxWidth, topY + boxH / 2, centerX + centerBoxWidth + connectorGap, topY + boxH / 2);
    doc.line(centerX + centerBoxWidth, bottomY + boxH / 2, centerX + centerBoxWidth + connectorGap, bottomY + boxH / 2);
    doc.line(
      centerX + centerBoxWidth + connectorGap,
      topY + boxH / 2,
      centerX + centerBoxWidth + connectorGap,
      bottomY + boxH / 2,
    );
    doc.line(centerX + centerBoxWidth + connectorGap, midY, rightStartX, midY);

    // Left connector from center to consolation R1
    if (consolRounds > 0) {
      doc.line(centerX, topY + boxH / 2, centerX - connectorGap, topY + boxH / 2);
      doc.line(centerX, bottomY + boxH / 2, centerX - connectorGap, bottomY + boxH / 2);
      doc.line(centerX - connectorGap, topY + boxH / 2, centerX - connectorGap, bottomY + boxH / 2);
      doc.line(centerX - connectorGap, midY, leftEdgeX, midY);
    }
  }

  // ---- Right side: Main R2+ (left-to-right) ----
  renderRightBracket(
    doc,
    mainMatchUps,
    mainSlotMap,
    mainRounds,
    r1Count,
    rightStartX,
    rightColWidth,
    connectorGap,
    contentTop,
    lineHeight,
    fontSize,
    scoreFontSize,
    format,
    data.mainDraw.roundLabelMap,
  );

  // ---- Left side: Consolation (right-to-left, mirrored) ----
  renderLeftBracket(
    doc,
    consolMatchUps,
    consolSlotMap,
    consolRounds,
    leftEdgeX,
    leftColWidth,
    connectorGap,
    contentTop,
    lineHeight,
    r1Count,
    fontSize,
    scoreFontSize,
    format,
    data.consolation.roundLabelMap,
  );
}

function renderRightBracket(
  doc: jsPDF,
  matchUps: DrawMatchUp[],
  slotMap: Map<number, DrawSlot>,
  totalRounds: number,
  r1Count: number,
  startX: number,
  colWidth: number,
  connGap: number,
  contentTop: number,
  lineHeight: number,
  fontSize: number,
  scoreFontSize: number,
  format: DrawFormatConfig,
  _roundLabelMap?: Record<number, string>,
): void {
  // R2..Rn of the main draw, standard left-to-right
  for (let rIdx = 0; rIdx < totalRounds - 1; rIdx++) {
    const roundNum = rIdx + 2;
    const roundMus = matchUps
      .filter((m) => m.roundNumber === roundNum)
      .sort((a, b) => a.roundPosition - b.roundPosition);
    const spacing = lineHeight * Math.pow(2, rIdx + 1);
    const roundOffset = ((Math.pow(2, rIdx + 1) - 1) * lineHeight) / 2;
    const colX = startX + rIdx * (colWidth + connGap);

    for (let mi = 0; mi < roundMus.length; mi++) {
      const mu = roundMus[mi];
      const topY = contentTop + roundOffset + mi * spacing * 2;
      const bottomY = topY + spacing;
      const midY = (topY + bottomY) / 2;

      // Horizontal slot lines
      doc.setDrawColor(40);
      doc.setLineWidth(0.25);
      doc.line(colX, topY, colX + colWidth, topY);
      doc.line(colX, bottomY, colX + colWidth, bottomY);

      // Advancing names
      renderAdvancingNames(doc, mu, slotMap, colX, topY, bottomY, colWidth, fontSize, format);

      // Bracket connector (if not last round)
      if (rIdx < totalRounds - 2) {
        const rightX = colX + colWidth;
        doc.line(rightX + connGap, topY, rightX + connGap, bottomY);
        doc.line(rightX, topY, rightX + connGap, topY);
        doc.line(rightX, bottomY, rightX + connGap, bottomY);
        doc.line(
          rightX + connGap,
          midY,
          colX + colWidth + connGap + colWidth + connGap > 0
            ? startX + (rIdx + 1) * (colWidth + connGap)
            : rightX + connGap + 5,
          midY,
        );
      }

      // Score
      if (mu.score) {
        setFont(doc, scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        doc.text(formatMatchScore(mu.score, format), colX + colWidth - 1, midY + scoreFontSize * 0.12, {
          align: 'right',
        });
        doc.setTextColor(0);
      }
    }
  }

  // Winner line
  const winnerX = startX + (totalRounds - 2) * (colWidth + connGap) + colWidth + connGap;
  const winnerMidY =
    contentTop + ((Math.pow(2, totalRounds - 1) - 1) * lineHeight) / 2 + lineHeight * Math.pow(2, totalRounds - 2);
  doc.setDrawColor(40);
  doc.setLineWidth(0.25);
  doc.line(winnerX, winnerMidY, winnerX + colWidth, winnerMidY);

  const finalMu = matchUps.find((m) => m.roundNumber === totalRounds);
  if (finalMu?.winningSide) {
    const winnerSlot = slotMap.get(finalMu.drawPositions[finalMu.winningSide - 1]);
    if (winnerSlot) {
      const { name } = formatPlayerEntrySplit(winnerSlot, format);
      setFont(doc, fontSize + 1, STYLE.BOLD);
      doc.text(name, winnerX + 1, winnerMidY - 0.5);
    }
  }
}

function renderLeftBracket(
  doc: jsPDF,
  matchUps: DrawMatchUp[],
  slotMap: Map<number, DrawSlot>,
  totalRounds: number,
  rightEdge: number,
  colWidth: number,
  connGap: number,
  contentTop: number,
  lineHeight: number,
  r1Count: number,
  fontSize: number,
  scoreFontSize: number,
  format: DrawFormatConfig,
  _roundLabelMap?: Record<number, string>,
): void {
  // Consolation R1..Rn, right-to-left (mirrored)
  for (let rIdx = 0; rIdx < totalRounds; rIdx++) {
    const roundNum = rIdx + 1;
    const roundMus = matchUps
      .filter((m) => m.roundNumber === roundNum)
      .sort((a, b) => a.roundPosition - b.roundPosition);
    const spacing = lineHeight * Math.pow(2, rIdx + 1);
    const roundOffset = ((Math.pow(2, rIdx + 1) - 1) * lineHeight) / 2;
    const colX = rightEdge - (rIdx + 1) * (colWidth + connGap);

    for (let mi = 0; mi < roundMus.length; mi++) {
      const mu = roundMus[mi];
      const topY = contentTop + roundOffset + mi * spacing * 2;
      const bottomY = topY + spacing;
      const midY = (topY + bottomY) / 2;

      // Horizontal slot lines
      doc.setDrawColor(40);
      doc.setLineWidth(0.25);
      doc.line(colX, topY, colX + colWidth, topY);
      doc.line(colX, bottomY, colX + colWidth, bottomY);

      // Advancing names (right-aligned for mirrored)
      if (mu.drawPositions[0]) {
        const slot = slotMap.get(mu.drawPositions[0]);
        if (slot?.participantName) {
          setFont(doc, fontSize, STYLE.BOLD);
          let name = slot.participantName;
          if (doc.getTextWidth(name) > colWidth - 2) name = abbreviateName(name);
          doc.text(name, colX + colWidth - 1, topY - 0.3, { align: 'right' });
        }
      }
      if (mu.drawPositions[1]) {
        const slot = slotMap.get(mu.drawPositions[1]);
        if (slot?.participantName) {
          setFont(doc, fontSize, STYLE.BOLD);
          let name = slot.participantName;
          if (doc.getTextWidth(name) > colWidth - 2) name = abbreviateName(name);
          doc.text(name, colX + colWidth - 1, bottomY - 0.3, { align: 'right' });
        }
      }

      // Bracket connector (mirrored — points left)
      if (rIdx < totalRounds - 1) {
        doc.line(colX - connGap, topY, colX - connGap, bottomY);
        doc.line(colX, topY, colX - connGap, topY);
        doc.line(colX, bottomY, colX - connGap, bottomY);
        const nextColX = rightEdge - (rIdx + 2) * (colWidth + connGap);
        doc.line(colX - connGap, midY, nextColX + colWidth, midY);
      }

      // Score
      if (mu.score) {
        setFont(doc, scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        doc.text(formatMatchScore(mu.score, format), colX + 1, midY + scoreFontSize * 0.12);
        doc.setTextColor(0);
      }
    }
  }

  // Consolation winner line
  if (totalRounds > 0) {
    const winnerX = rightEdge - (totalRounds + 1) * (colWidth + connGap);
    const winnerMidY =
      contentTop + ((Math.pow(2, totalRounds) - 1) * lineHeight) / 2 + lineHeight * Math.pow(2, totalRounds - 1);
    doc.setDrawColor(40);
    doc.setLineWidth(0.25);
    doc.line(winnerX, winnerMidY, winnerX + colWidth, winnerMidY);

    const finalMu = matchUps.find((m) => m.roundNumber === totalRounds);
    if (finalMu?.winningSide) {
      const winnerSlot = slotMap.get(finalMu.drawPositions[finalMu.winningSide - 1]);
      if (winnerSlot) {
        const { name } = formatPlayerEntrySplit(winnerSlot, format);
        setFont(doc, fontSize + 1, STYLE.BOLD);
        doc.text(name, winnerX + colWidth - 1, winnerMidY - 0.5, { align: 'right' });
      }
    }
  }
}

function renderAdvancingNames(
  doc: jsPDF,
  mu: DrawMatchUp,
  slotMap: Map<number, DrawSlot>,
  colX: number,
  topY: number,
  bottomY: number,
  colWidth: number,
  fontSize: number,
  _format: DrawFormatConfig,
): void {
  if (mu.drawPositions[0]) {
    const slot = slotMap.get(mu.drawPositions[0]);
    if (slot?.participantName) {
      setFont(doc, fontSize, STYLE.BOLD);
      let name = slot.participantName;
      if (doc.getTextWidth(name) > colWidth - 2) name = abbreviateName(name);
      doc.text(name, colX + 1, topY - 0.3);
    }
  }
  if (mu.drawPositions[1]) {
    const slot = slotMap.get(mu.drawPositions[1]);
    if (slot?.participantName) {
      setFont(doc, fontSize, STYLE.BOLD);
      let name = slot.participantName;
      if (doc.getTextWidth(name) > colWidth - 2) name = abbreviateName(name);
      doc.text(name, colX + 1, bottomY - 0.3);
    }
  }
}

function renderBackdrawHeaders(
  doc: jsPDF,
  mainRounds: number,
  consolRounds: number,
  data: BackdrawData,
  format: DrawFormatConfig,
  centerX: number,
  centerBoxWidth: number,
  rightStartX: number,
  rightColWidth: number,
  leftEdgeX: number,
  leftColWidth: number,
  connGap: number,
  y: number,
  fontSize: number,
): void {
  const headerFontSize = fontSize <= SIZE.TINY ? 5.5 : SIZE.SMALL;
  setFont(doc, headerFontSize, STYLE.BOLD);
  doc.setTextColor(40);

  // Center: "First Round"
  const firstRoundLabel = data.mainDraw.roundLabelMap?.[1] || 'R1';
  doc.text(firstRoundLabel, centerX + centerBoxWidth / 2, y, { align: 'center' });

  // Right: Main R2+
  for (let i = 0; i < mainRounds - 1; i++) {
    const roundNum = i + 2;
    const label = data.mainDraw.roundLabelMap?.[roundNum] || `R${roundNum}`;
    const colX = rightStartX + i * (rightColWidth + connGap);
    doc.text(label, colX + rightColWidth / 2, y, { align: 'center' });
  }

  // Left: Consolation (mirrored, labels right-to-left)
  for (let i = 0; i < consolRounds; i++) {
    const roundNum = i + 1;
    const label = data.consolation.roundLabelMap?.[roundNum] || `C-R${roundNum}`;
    const colX = leftEdgeX - (i + 1) * (leftColWidth + connGap);
    doc.text(label, colX + leftColWidth / 2, y, { align: 'center' });
  }

  doc.setTextColor(0);
}

function abbreviateName(fullName: string): string {
  const commaMatch = fullName.match(/^([^,]+),\s*(.+)/);
  if (commaMatch) return `${commaMatch[2][0]}. ${commaMatch[1]}`;
  const spaceMatch = fullName.match(/^(\S+)\s+(.+)/);
  if (spaceMatch) return `${spaceMatch[1][0]}. ${spaceMatch[2]}`;
  return fullName;
}
