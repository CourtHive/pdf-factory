/**
 * Mirrored bracket renderer (NCAA-style).
 *
 * Two halves of the draw progress inward — left half flows left-to-right,
 * right half flows right-to-left. The winner column is in the center.
 *
 * Layout:
 *   [Left R1] [Left R2] ... [Left SF]  |WINNER|  [Right SF] ... [Right R2] [Right R1]
 *
 * Used for: NCAA team tennis, collegiate dual matches, club events.
 */

import jsPDF from 'jspdf';
import type { DrawFormatConfig, PageRegions } from '../config/types';
import type { DrawData, DrawSlot, DrawMatchUp } from '../core/extractDrawData';
import { getRoundLabel } from '../core/extractDrawData';
import { formatPlayerEntrySplit, formatMatchScore } from './formatEntry';
import { setFont, SIZE, STYLE } from '../layout/fonts';

interface HalfConfig {
  lineHeight: number;
  roundColumnWidth: number;
  firstRoundWidth: number;
  connectorGap: number;
  fontSize: number;
  scoreFontSize: number;
}

export function renderMirroredDraw(
  doc: jsPDF,
  drawData: DrawData,
  format: DrawFormatConfig,
  regions: PageRegions,
): void {
  const margins = format.page.margins;
  const headerReserve = 9;
  const startY = regions.contentY + headerReserve;
  const contentHeight = regions.contentHeight - headerReserve;

  const halfSize = drawData.drawSize / 2;
  const halfRounds = Math.log2(halfSize);
  const totalWidth = regions.contentWidth;

  // Center column for winner
  const centerWidth = Math.min(40, totalWidth * 0.12);
  const halfWidth = (totalWidth - centerWidth) / 2;
  const centerX = margins.left + halfWidth;

  // Config for each half
  const lineHeight = contentHeight / halfSize;
  const isDense = lineHeight < 3.5;
  const connectorGap = isDense ? 0.8 : 1.5;
  const firstRoundWidth = Math.min(isDense ? 38 : 55, halfWidth * 0.3);
  const laterCols = halfRounds; // includes all rounds after R1
  const remaining = halfWidth - firstRoundWidth - connectorGap * (laterCols + 1);
  const roundColumnWidth = Math.min(50, Math.max(8, remaining / Math.max(1, laterCols)));
  let fontSize = SIZE.SMALL;
  if (lineHeight < 2.5) fontSize = 5;
  else if (isDense) fontSize = SIZE.TINY;
  const scoreFontSize = isDense ? 5 : SIZE.TINY;

  const config: HalfConfig = { lineHeight, roundColumnWidth, firstRoundWidth, connectorGap, fontSize, scoreFontSize };

  // Split matchUps and slots into two halves
  const leftSlots = drawData.slots.filter((s) => s.drawPosition <= halfSize);
  const rightSlots = drawData.slots.filter((s) => s.drawPosition > halfSize);

  const leftMatchUps = drawData.matchUps.filter((mu) => mu.drawPositions.every((dp) => dp <= halfSize));
  const rightMatchUps = drawData.matchUps.filter((mu) => mu.drawPositions.every((dp) => dp > halfSize));

  // Renumber right half positions to 1..halfSize
  const rightSlotsRenumbered = rightSlots.map((s) => ({ ...s, drawPosition: s.drawPosition - halfSize }));
  const rightMatchUpsRenumbered = rightMatchUps.map((mu) => ({
    ...mu,
    drawPositions: mu.drawPositions.map((dp) => dp - halfSize),
  }));

  // Round headers
  renderMirroredRoundHeaders(
    doc,
    halfRounds,
    drawData.totalRounds,
    config,
    format,
    margins.left,
    centerX + centerWidth,
    regions.contentY + 2,
    drawData.roundLabelMap,
  );

  // Winner column header
  setFont(doc, isDense ? 5.5 : SIZE.SMALL, STYLE.BOLD);
  doc.setTextColor(40);
  doc.text('Winner', centerX + centerWidth / 2, regions.contentY + 2, { align: 'center' });
  doc.setDrawColor(160);
  doc.setLineWidth(0.15);
  doc.line(centerX + 2, regions.contentY + 3.5, centerX + centerWidth - 2, regions.contentY + 3.5);
  doc.setTextColor(0);

  // Render left half (left-to-right, normal direction)
  renderLeftHalf(doc, leftSlots, leftMatchUps, halfRounds, config, format, margins.left, startY, drawData.totalRounds);

  // Render right half (right-to-left, mirrored)
  renderRightHalf(
    doc,
    rightSlotsRenumbered,
    rightMatchUpsRenumbered,
    halfRounds,
    config,
    format,
    centerX + centerWidth,
    startY,
    drawData.totalRounds,
  );

  // Winner in center
  const finalMu = drawData.matchUps.find((mu) => mu.roundNumber === drawData.totalRounds);
  if (finalMu) {
    const winnerMidY = startY + contentHeight / 2;

    // Winner line
    doc.setDrawColor(40);
    doc.setLineWidth(0.25);
    doc.line(centerX + 2, winnerMidY, centerX + centerWidth - 2, winnerMidY);

    if (finalMu.winningSide) {
      const winnerPos = finalMu.drawPositions[finalMu.winningSide - 1];
      const winnerSlot = drawData.slots.find((s) => s.drawPosition === winnerPos);
      if (winnerSlot) {
        const { name } = formatPlayerEntrySplit(winnerSlot, format);
        setFont(doc, fontSize + 1, STYLE.BOLD);
        doc.text(name, centerX + centerWidth / 2, winnerMidY - 1, { align: 'center' });
      }
    }

    if (finalMu.score) {
      setFont(doc, scoreFontSize, STYLE.NORMAL);
      doc.setTextColor(60, 60, 160);
      doc.text(formatMatchScore(finalMu.score, format), centerX + centerWidth / 2, winnerMidY + scoreFontSize * 0.4, {
        align: 'center',
      });
      doc.setTextColor(0);
    }
  }
}

function renderLeftHalf(
  doc: jsPDF,
  slots: DrawSlot[],
  matchUps: DrawMatchUp[],
  totalRounds: number,
  config: HalfConfig,
  format: DrawFormatConfig,
  startX: number,
  startY: number,
  _fullTotalRounds: number,
): void {
  const slotMap = new Map(slots.map((s) => [s.drawPosition, s]));
  const count = slots.length;

  for (let round = 0; round < totalRounds; round++) {
    const matchesInRound = count / Math.pow(2, round + 1);
    const spacing = config.lineHeight * Math.pow(2, round);
    const roundOffset = ((Math.pow(2, round) - 1) * config.lineHeight) / 2;
    const stride = Math.pow(2, round + 1) * config.lineHeight;
    const roundX = leftRoundX(round, config, startX);
    const colWidth = round === 0 ? config.firstRoundWidth : config.roundColumnWidth;

    for (let match = 0; match < matchesInRound; match++) {
      const topSlotY = startY + roundOffset + match * stride;
      const bottomSlotY = topSlotY + spacing;
      const midY = (topSlotY + bottomSlotY) / 2;

      if (round === 0) {
        const topPos = match * 2 + 1;
        const bottomPos = match * 2 + 2;
        drawPlayerLineCompact(doc, slotMap.get(topPos), config, roundX, topSlotY, colWidth, 'ltr');
        drawPlayerLineCompact(doc, slotMap.get(bottomPos), config, roundX, bottomSlotY, colWidth, 'ltr');
      } else {
        doc.setDrawColor(40);
        doc.setLineWidth(0.25);
        doc.line(roundX, topSlotY, roundX + colWidth, topSlotY);
        doc.line(roundX, bottomSlotY, roundX + colWidth, bottomSlotY);
      }

      // Right bracket
      const rightX = roundX + colWidth;
      const nextRoundX = leftRoundX(round + 1, config, startX);
      doc.setDrawColor(40);
      doc.setLineWidth(0.25);
      doc.line(rightX + config.connectorGap, topSlotY, rightX + config.connectorGap, bottomSlotY);
      doc.line(rightX, topSlotY, rightX + config.connectorGap, topSlotY);
      doc.line(rightX, bottomSlotY, rightX + config.connectorGap, bottomSlotY);
      doc.line(rightX + config.connectorGap, midY, nextRoundX, midY);

      // Advancing name
      const mu = findMatchUp(matchUps, round + 1, match + 1);
      if (round < totalRounds - 1 && mu?.winningSide) {
        const winnerPos = mu.drawPositions[mu.winningSide - 1];
        const winnerSlot = slotMap.get(winnerPos);
        if (winnerSlot) {
          const shortName = abbreviateName(winnerSlot.participantName);
          setFont(doc, config.fontSize, STYLE.BOLD);
          doc.text(shortName, nextRoundX + 1, midY - 0.5);
        }
      }

      // Score
      if (mu?.score && round < totalRounds - 1) {
        setFont(doc, config.scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        doc.text(formatMatchScore(mu.score, format), nextRoundX + 1, midY - 0.5 + config.scoreFontSize * 0.4);
        doc.setTextColor(0);
      }
    }
  }
}

function renderRightHalf(
  doc: jsPDF,
  slots: DrawSlot[],
  matchUps: DrawMatchUp[],
  totalRounds: number,
  config: HalfConfig,
  format: DrawFormatConfig,
  rightEdge: number,
  startY: number,
  _fullTotalRounds: number,
): void {
  const slotMap = new Map(slots.map((s) => [s.drawPosition, s]));
  const count = slots.length;

  for (let round = 0; round < totalRounds; round++) {
    const matchesInRound = count / Math.pow(2, round + 1);
    const spacing = config.lineHeight * Math.pow(2, round);
    const roundOffset = ((Math.pow(2, round) - 1) * config.lineHeight) / 2;
    const stride = Math.pow(2, round + 1) * config.lineHeight;
    const roundX = rightRoundX(round, config, rightEdge);
    const colWidth = round === 0 ? config.firstRoundWidth : config.roundColumnWidth;

    for (let match = 0; match < matchesInRound; match++) {
      const topSlotY = startY + roundOffset + match * stride;
      const bottomSlotY = topSlotY + spacing;
      const midY = (topSlotY + bottomSlotY) / 2;

      if (round === 0) {
        const topPos = match * 2 + 1;
        const bottomPos = match * 2 + 2;
        drawPlayerLineCompact(doc, slotMap.get(topPos), config, roundX, topSlotY, colWidth, 'rtl');
        drawPlayerLineCompact(doc, slotMap.get(bottomPos), config, roundX, bottomSlotY, colWidth, 'rtl');
      } else {
        doc.setDrawColor(40);
        doc.setLineWidth(0.25);
        doc.line(roundX, topSlotY, roundX + colWidth, topSlotY);
        doc.line(roundX, bottomSlotY, roundX + colWidth, bottomSlotY);
      }

      // Left bracket (mirrored — vertical + stubs pointing left)
      const leftX = roundX;
      const prevRoundX = rightRoundX(round + 1, config, rightEdge);
      doc.setDrawColor(40);
      doc.setLineWidth(0.25);
      doc.line(leftX - config.connectorGap, topSlotY, leftX - config.connectorGap, bottomSlotY);
      doc.line(leftX, topSlotY, leftX - config.connectorGap, topSlotY);
      doc.line(leftX, bottomSlotY, leftX - config.connectorGap, bottomSlotY);
      doc.line(leftX - config.connectorGap, midY, prevRoundX + config.roundColumnWidth, midY);

      // Advancing name (right-aligned in the next inward column)
      const mu = findMatchUp(matchUps, round + 1, match + 1);
      if (round < totalRounds - 1 && mu?.winningSide) {
        const winnerPos = mu.drawPositions[mu.winningSide - 1];
        const winnerSlot = slotMap.get(winnerPos);
        if (winnerSlot) {
          const shortName = abbreviateName(winnerSlot.participantName);
          setFont(doc, config.fontSize, STYLE.BOLD);
          const nextColX = prevRoundX;
          doc.text(shortName, nextColX + config.roundColumnWidth - 1, midY - 0.5, { align: 'right' });
        }
      }

      // Score
      if (mu?.score && round < totalRounds - 1) {
        const nextColX = prevRoundX;
        setFont(doc, config.scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        doc.text(
          formatMatchScore(mu.score, format),
          nextColX + config.roundColumnWidth - 1,
          midY - 0.5 + config.scoreFontSize * 0.4,
          { align: 'right' },
        );
        doc.setTextColor(0);
      }
    }
  }
}

function renderMirroredRoundHeaders(
  doc: jsPDF,
  halfRounds: number,
  totalRounds: number,
  config: HalfConfig,
  format: DrawFormatConfig,
  leftStartX: number,
  rightStartX: number,
  y: number,
  roundLabelMap?: Record<number, string>,
): void {
  const headerFontSize = config.fontSize <= SIZE.TINY ? 5.5 : SIZE.SMALL;
  setFont(doc, headerFontSize, STYLE.BOLD);
  doc.setTextColor(40);

  for (let round = 0; round < halfRounds; round++) {
    const roundNumber = totalRounds - halfRounds + round + 1;
    const defaultLabel = getRoundLabel(roundNumber, totalRounds);
    const label = roundLabelMap?.[roundNumber] || format.roundLabels[defaultLabel] || defaultLabel;
    const width = round === 0 ? config.firstRoundWidth : config.roundColumnWidth;

    // Left side
    const leftX = leftRoundX(round, config, leftStartX);
    doc.text(label, leftX + width / 2, y, { align: 'center' });
    doc.setDrawColor(160);
    doc.setLineWidth(0.15);
    doc.line(leftX + 2, y + 1.5, leftX + width - 2, y + 1.5);

    // Right side (mirrored)
    const rightX = rightRoundX(round, config, rightStartX);
    doc.text(label, rightX + width / 2, y, { align: 'center' });
    doc.line(rightX + 2, y + 1.5, rightX + width - 2, y + 1.5);
  }

  doc.setTextColor(0);
}

function leftRoundX(round: number, config: HalfConfig, startX: number): number {
  if (round === 0) return startX;
  return (
    startX +
    config.firstRoundWidth +
    config.connectorGap +
    (round - 1) * (config.roundColumnWidth + config.connectorGap)
  );
}

function rightRoundX(round: number, config: HalfConfig, rightEdge: number): number {
  if (round === 0) return rightEdge - config.firstRoundWidth;
  return (
    rightEdge -
    config.firstRoundWidth -
    config.connectorGap -
    (round - 1) * (config.roundColumnWidth + config.connectorGap) -
    config.roundColumnWidth
  );
}

function drawPlayerLineCompact(
  doc: jsPDF,
  slot: DrawSlot | undefined,
  config: HalfConfig,
  x: number,
  y: number,
  width: number,
  direction: 'ltr' | 'rtl',
): void {
  doc.setDrawColor(40);
  doc.setLineWidth(0.25);
  doc.line(x, y, x + width, y);

  if (!slot || slot.isBye) {
    if (slot?.isBye) {
      setFont(doc, config.fontSize, STYLE.ITALIC);
      doc.setTextColor(150);
      if (direction === 'ltr') {
        doc.text('Bye', x + 1, y - 0.3);
      } else {
        doc.text('Bye', x + width - 1, y - 0.3, { align: 'right' });
      }
      doc.setTextColor(0);
    }
    return;
  }

  const name = abbreviateName(slot.participantName);
  const seed = slot.seedValue ? `[${slot.seedValue}]` : '';
  const display = seed ? `${seed} ${name}` : name;

  setFont(doc, config.fontSize, STYLE.NORMAL);
  if (direction === 'ltr') {
    doc.text(display, x + 1, y - 0.3);
  } else {
    doc.text(display, x + width - 1, y - 0.3, { align: 'right' });
  }
}

function abbreviateName(fullName: string): string {
  const match = fullName.match(/^([^,]+),\s*(.+)/);
  if (match) return `${match[2][0]}. ${match[1]}`;
  return fullName;
}

function findMatchUp(matchUps: DrawMatchUp[], roundNumber: number, roundPosition: number): DrawMatchUp | undefined {
  return matchUps.find((mu) => mu.roundNumber === roundNumber && mu.roundPosition === roundPosition);
}
