import jsPDF from 'jspdf';
import type { DrawFormatConfig, PageRegions } from '../config/types';
import type { DrawData, DrawSlot, DrawMatchUp } from '../core/extractDrawData';
import { getRoundLabel } from '../core/extractDrawData';
import { formatPlayerEntry, formatMatchScore } from './formatEntry';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface TraditionalDrawConfig {
  lineHeight: number;
  roundColumnWidth: number;
  firstRoundWidth: number;
  connectorGap: number;
  fontSize: number;
  scoreFontSize: number;
}

export function getDrawConfig(positionCount: number, regions: PageRegions): TraditionalDrawConfig {
  const totalRounds = Math.log2(positionCount);

  // Height: reserve 6mm for round headers. The bracket spans positionCount-1 gaps.
  const headerReserve = 6;
  const availableHeight = regions.contentHeight - headerReserve;
  const lineHeight = availableHeight / positionCount;
  const isDense = lineHeight < 3.5;

  // Width: first round + connectorGap + (totalRounds-1) later round columns + connectorGap each + winner column
  // Total columns after R1 = totalRounds (rounds 2..N = totalRounds-1, plus 1 winner column)
  const connectorGap = isDense ? 0.8 : 1.5;
  const laterColumns = totalRounds; // includes winner column
  const totalConnectorWidth = connectorGap * (laterColumns + 1); // gap before each later column + gap after R1

  // First round gets enough for position number + name; later rounds share the rest equally
  const firstRoundPct = isDense ? 0.28 : 0.3;
  const firstRoundWidth = Math.min(isDense ? 50 : 65, regions.contentWidth * firstRoundPct);
  const remainingWidth = regions.contentWidth - firstRoundWidth - totalConnectorWidth;
  const roundColumnWidth = Math.max(8, remainingWidth / Math.max(1, laterColumns));

  // Font sizing adapts to density
  let fontSize = SIZE.SMALL;
  if (lineHeight < 2.5) fontSize = 5;
  else if (lineHeight < 3.5) fontSize = SIZE.TINY;

  return {
    lineHeight,
    roundColumnWidth,
    firstRoundWidth,
    connectorGap,
    fontSize,
    scoreFontSize: isDense ? 5 : SIZE.TINY,
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

  // Round headers (including winner column)
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
        const topPos = positionOffset + match * 2 + 1;
        const bottomPos = positionOffset + match * 2 + 2;
        const topSlot = findSlot(drawData.slots, topPos);
        const bottomSlot = findSlot(drawData.slots, bottomPos);

        drawPlayerLine(doc, topSlot, topPos, format, config, roundX, topSlotY);
        drawPlayerLine(doc, bottomSlot, bottomPos, format, config, roundX, bottomSlotY);
      }

      // Connector lines
      const rightX = roundX + (round === 0 ? config.firstRoundWidth : config.roundColumnWidth);
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

      // Advancing player name on the next round line
      const mu = findMatchUp(drawData.matchUps, round + 1, match + 1);
      if (round < totalRounds - 1 && mu?.winningSide) {
        const winnerPos = mu.drawPositions[mu.winningSide - 1];
        const winnerSlot = findSlot(drawData.slots, winnerPos);
        if (winnerSlot) {
          drawAdvancingName(doc, winnerSlot, format, config, nextRoundX, midY);
        }
      }

      // Score beneath the advancing name
      if (mu?.score) {
        const scoreStr = formatMatchScore(mu.score, format);
        setFont(doc, config.scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        doc.text(scoreStr, nextRoundX + 1, midY + config.scoreFontSize * 0.35 + 0.5);
        doc.setTextColor(0);
      }
    }
  }

  // Final winner — on the connector midpoint of the final round
  const finalMu = findMatchUp(drawData.matchUps, totalRounds, 1);
  if (finalMu?.winningSide) {
    const winnerPos = finalMu.drawPositions[finalMu.winningSide - 1];
    const winnerSlot = findSlot(drawData.slots, winnerPos);
    if (winnerSlot) {
      const winnerX = getRoundX(totalRounds, config, startX);
      const finalSpacing = config.lineHeight * Math.pow(2, totalRounds - 1);
      const winnerMidY = startY + finalSpacing / 2;

      // Name above the line
      setFont(doc, config.fontSize + 1, STYLE.BOLD);
      const winnerText = formatPlayerEntry(winnerSlot, format);
      doc.text(winnerText, winnerX + 1, winnerMidY - 0.5);

      // Score beneath
      if (finalMu.score) {
        const scoreStr = formatMatchScore(finalMu.score, format);
        setFont(doc, config.scoreFontSize, STYLE.NORMAL);
        doc.setTextColor(60, 60, 160);
        doc.text(scoreStr, winnerX + 1, winnerMidY + config.scoreFontSize * 0.35 + 0.5);
        doc.setTextColor(0);
      }
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
  const isDense = config.fontSize <= SIZE.TINY;
  const headerFontSize = isDense ? 5.5 : SIZE.SMALL;

  setFont(doc, headerFontSize, STYLE.BOLD);
  doc.setTextColor(40);

  // Round headers for R1..Rn
  for (let round = 0; round < segmentRounds; round++) {
    const roundNumber = totalRounds - segmentRounds + round + 1;
    const label =
      format.roundLabels[getRoundLabel(roundNumber, totalRounds)] || getRoundLabel(roundNumber, totalRounds);
    const x = getRoundX(round, config, startX);
    const width = round === 0 ? config.firstRoundWidth : config.roundColumnWidth;
    const centerX = x + width / 2;

    doc.text(label, centerX, y, { align: 'center' });

    doc.setDrawColor(160);
    doc.setLineWidth(0.15);
    doc.line(x + 2, y + 1.5, x + width - 2, y + 1.5);
  }

  // Winner column header
  const winnerX = getRoundX(segmentRounds, config, startX);
  doc.text('Winner', winnerX + config.roundColumnWidth / 2, y, { align: 'center' });
  doc.setDrawColor(160);
  doc.setLineWidth(0.15);
  doc.line(winnerX + 2, y + 1.5, winnerX + config.roundColumnWidth - 2, y + 1.5);

  doc.setTextColor(0);
}

function getRoundX(round: number, config: TraditionalDrawConfig, startX: number): number {
  if (round === 0) return startX;
  return (
    startX +
    config.firstRoundWidth +
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
  const posNumWidth = config.fontSize <= 5 ? 5 : 7;

  // Draw position number
  setFont(doc, config.scoreFontSize, STYLE.NORMAL);
  doc.setTextColor(120);
  doc.text(`${drawPosition}`, x, y - 0.3, { align: 'left' });
  doc.setTextColor(0);

  // Horizontal line
  const lineStart = x + posNumWidth;
  const lineEnd = x + config.firstRoundWidth;
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
