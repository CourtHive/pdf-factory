import jsPDF from 'jspdf';
import type { DrawFormatConfig, PageRegions } from '../config/types';
import type { DrawData, DrawSlot, DrawMatchUp } from '../core/extractDrawData';
import { getRoundLabel } from '../core/extractDrawData';
import { formatPlayerEntry, formatMatchScore } from './formatEntry';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface TraditionalDrawConfig {
  lineHeight: number;
  roundColumnWidth: number;
  firstRoundExtraWidth: number;
  connectorGap: number;
  fontSize: number;
  scoreFontSize: number;
}

export function getDrawConfig(positionCount: number, regions: PageRegions): TraditionalDrawConfig {
  const availableHeight = regions.contentHeight - 8;
  const lineHeight = Math.min(4.5, availableHeight / positionCount);
  const totalRounds = Math.log2(positionCount);

  // Use nearly the full page width — first round gets ~35%, remaining rounds share the rest
  const firstRoundWidth = Math.min(70, regions.contentWidth * 0.35);
  const remainingWidth = regions.contentWidth - firstRoundWidth;
  const connectorGap = 1.5;
  const roundColumnWidth = (remainingWidth - connectorGap * totalRounds) / Math.max(1, totalRounds - 1);

  return {
    lineHeight,
    roundColumnWidth: Math.max(15, roundColumnWidth),
    firstRoundExtraWidth: firstRoundWidth,
    connectorGap,
    fontSize: lineHeight > 3 ? SIZE.SMALL : SIZE.TINY,
    scoreFontSize: SIZE.TINY,
  };
}

export function renderTraditionalDraw(
  doc: jsPDF,
  drawData: DrawData,
  format: DrawFormatConfig,
  regions: PageRegions,
  positionOffset: number = 0,
  positionCount?: number,
): void {
  const count = positionCount || drawData.drawSize;
  const totalRounds = Math.log2(count);
  const config = getDrawConfig(count, regions);
  const margins = format.page.margins;

  const startX = margins.left;
  const startY = regions.contentY + 6;

  // Round headers
  renderRoundHeaders(doc, totalRounds, drawData.totalRounds, config, format, startX, regions.contentY + 2);

  // Draw the bracket
  for (let round = 0; round < totalRounds; round++) {
    const matchesInRound = count / Math.pow(2, round + 1);
    const spacing = config.lineHeight * Math.pow(2, round);
    const roundX = getRoundX(round, config, startX);

    for (let match = 0; match < matchesInRound; match++) {
      const topSlotY = startY + match * spacing * 2;
      const bottomSlotY = topSlotY + spacing;
      const midY = (topSlotY + bottomSlotY) / 2;

      if (round === 0) {
        // First round: draw position numbers + player names on lines
        const topPos = positionOffset + match * 2 + 1;
        const bottomPos = positionOffset + match * 2 + 2;
        const topSlot = findSlot(drawData.slots, topPos);
        const bottomSlot = findSlot(drawData.slots, bottomPos);

        drawPlayerLine(doc, topSlot, topPos, format, config, roundX, topSlotY);
        drawPlayerLine(doc, bottomSlot, bottomPos, format, config, roundX, bottomSlotY);
      }

      // Connector: horizontal from each slot to a vertical, then horizontal to next round
      const rightX = roundX + (round === 0 ? config.firstRoundExtraWidth : config.roundColumnWidth);
      const nextRoundX = getRoundX(round + 1, config, startX);

      doc.setDrawColor(40);
      doc.setLineWidth(0.25);

      // Horizontal stubs from top and bottom slots
      doc.line(rightX, topSlotY, rightX + config.connectorGap, topSlotY);
      doc.line(rightX, bottomSlotY, rightX + config.connectorGap, bottomSlotY);
      // Vertical connector
      doc.line(rightX + config.connectorGap, topSlotY, rightX + config.connectorGap, bottomSlotY);
      // Horizontal to next round
      doc.line(rightX + config.connectorGap, midY, nextRoundX, midY);

      // Score between connector and next round
      const mu = findMatchUp(drawData.matchUps, round + 1, match + 1);
      if (mu?.score) {
        const scoreStr = formatMatchScore(mu.score, format);
        setFont(doc, config.scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        doc.text(scoreStr, rightX + config.connectorGap + 1, midY - 0.5);
        doc.setTextColor(0);
      }

      // Advancing player name on the next round line
      if (round < totalRounds - 1 && mu?.winningSide) {
        const winnerPos = mu.drawPositions[mu.winningSide - 1];
        const winnerSlot = findSlot(drawData.slots, winnerPos);
        if (winnerSlot) {
          drawAdvancingName(doc, winnerSlot, format, config, nextRoundX, midY);
        }
      }
    }
  }

  // Final winner (if exists)
  const finalMu = findMatchUp(drawData.matchUps, totalRounds, 1);
  if (finalMu?.winningSide) {
    const winnerPos = finalMu.drawPositions[finalMu.winningSide - 1];
    const winnerSlot = findSlot(drawData.slots, winnerPos);
    if (winnerSlot) {
      const finalX = getRoundX(totalRounds, config, startX);
      const finalY = startY + (count / 2 - 0.5) * config.lineHeight;
      setFont(doc, config.fontSize + 1, STYLE.BOLD);
      doc.text(formatPlayerEntry(winnerSlot, format), finalX + 2, finalY + 1);
    }
  }
}

function renderRoundHeaders(
  doc: jsPDF,
  segmentRounds: number,
  totalRounds: number,
  config: TraditionalDrawConfig,
  format: DrawFormatConfig,
  startX: number,
  y: number,
): void {
  setFont(doc, SIZE.TINY, STYLE.BOLD);
  doc.setTextColor(60);

  for (let round = 0; round < segmentRounds; round++) {
    const roundNumber = totalRounds - segmentRounds + round + 1;
    const label =
      format.roundLabels[getRoundLabel(roundNumber, totalRounds)] || getRoundLabel(roundNumber, totalRounds);
    const x = getRoundX(round, config, startX);
    const width = round === 0 ? config.firstRoundExtraWidth : config.roundColumnWidth;
    doc.text(label, x + width / 2, y, { align: 'center' });
  }

  doc.setTextColor(0);
}

function getRoundX(round: number, config: TraditionalDrawConfig, startX: number): number {
  if (round === 0) return startX;
  return (
    startX +
    config.firstRoundExtraWidth +
    config.connectorGap +
    (round - 1) * (config.roundColumnWidth + config.connectorGap)
  );
}

function drawPlayerLine(
  doc: jsPDF,
  slot: DrawSlot | undefined,
  drawPosition: number,
  format: DrawFormatConfig,
  config: TraditionalDrawConfig,
  x: number,
  y: number,
): void {
  const posNumWidth = 7;

  // Draw position number (small, left of the line)
  setFont(doc, config.scoreFontSize, STYLE.NORMAL);
  doc.setTextColor(120);
  doc.text(`${drawPosition}`, x, y - 0.3, { align: 'left' });
  doc.setTextColor(0);

  // Horizontal line (starts after position number)
  const lineStart = x + posNumWidth;
  const lineEnd = x + config.firstRoundExtraWidth;
  doc.setDrawColor(40);
  doc.setLineWidth(0.25);
  doc.line(lineStart, y, lineEnd, y);

  if (!slot) return;

  const text = formatPlayerEntry(slot, format);
  if (!text) return;

  setFont(doc, config.fontSize, slot.isBye ? STYLE.ITALIC : STYLE.NORMAL);
  if (slot.isBye) doc.setTextColor(150);
  doc.text(text, lineStart + 1, y - 0.5);
  if (slot.isBye) doc.setTextColor(0);
}

function drawAdvancingName(
  doc: jsPDF,
  slot: DrawSlot,
  format: DrawFormatConfig,
  config: TraditionalDrawConfig,
  x: number,
  y: number,
): void {
  // Short form for advancing names: "F. LASTNAME" or just the name
  const shortName = abbreviateName(slot.participantName);
  let seed = '';
  if (slot.seedValue) {
    seed = format.seedFormat === 'parens' ? `(${slot.seedValue})` : `[${slot.seedValue}]`;
  }
  const display = seed ? `${shortName} ${seed}` : shortName;

  setFont(doc, config.fontSize, STYLE.NORMAL);
  doc.text(display, x + 1, y - 0.5);
}

function abbreviateName(fullName: string): string {
  // "LASTNAME, GivenName" -> "G. LASTNAME"
  const match = fullName.match(/^([^,]+),\s*(.+)/);
  if (match) return `${match[2][0]}. ${match[1]}`;
  return fullName;
}

function findSlot(slots: DrawSlot[], drawPosition: number): DrawSlot | undefined {
  return slots.find((s) => s.drawPosition === drawPosition);
}

function findMatchUp(matchUps: DrawMatchUp[], roundNumber: number, roundPosition: number): DrawMatchUp | undefined {
  return matchUps.find((mu) => mu.roundNumber === roundNumber && mu.roundPosition === roundPosition);
}
