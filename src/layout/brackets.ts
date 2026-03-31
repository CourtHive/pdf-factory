import jsPDF from 'jspdf';
import { setFont, SIZE, STYLE } from './fonts';

export interface BracketPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  participantName?: string;
  seed?: number;
  nationality?: string;
  score?: string;
  isBye?: boolean;
}

export interface BracketConfig {
  slotWidth: number;
  slotHeight: number;
  roundGap: number;
  verticalGap: number;
  startX: number;
  startY: number;
}

export const DEFAULT_BRACKET_CONFIG: BracketConfig = {
  slotWidth: 90,
  slotHeight: 14,
  roundGap: 20,
  verticalGap: 4,
  startX: 15,
  startY: 10,
};

export function calculateBracketPositions(
  drawSize: number,
  config: BracketConfig = DEFAULT_BRACKET_CONFIG,
  availableHeight?: number,
) {
  const rounds = Math.log2(drawSize);
  const positions: BracketPosition[][] = [];

  // Calculate spacing to fit all first-round slots within available height
  const firstRoundSlots = drawSize;
  let spacing = config.slotHeight + config.verticalGap;

  if (availableHeight) {
    const neededHeight = firstRoundSlots * spacing;
    if (neededHeight > availableHeight) {
      spacing = availableHeight / firstRoundSlots;
    }
  }

  const slotHeight = Math.max(spacing * 0.7, 5);

  for (let round = 0; round < rounds; round++) {
    const matchesInRound = drawSize / Math.pow(2, round + 1);
    const roundPositions: BracketPosition[] = [];

    for (let match = 0; match < matchesInRound; match++) {
      const roundOffset = Math.pow(2, round) * spacing;
      const baseY = config.startY + roundOffset / 2 - spacing / 2;

      const topY = baseY + match * roundOffset * 2;
      const bottomY = topY + roundOffset;

      const x = config.startX + round * (config.slotWidth + config.roundGap);

      roundPositions.push(
        { x, y: topY, width: config.slotWidth, height: slotHeight },
        { x, y: bottomY, width: config.slotWidth, height: slotHeight },
      );
    }

    positions.push(roundPositions);
  }

  return positions;
}

export function drawBracketSlot(doc: jsPDF, pos: BracketPosition) {
  // Draw slot box
  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  doc.rect(pos.x, pos.y, pos.width, pos.height);

  if (pos.isBye) {
    setFont(doc, SIZE.SMALL, STYLE.ITALIC);
    doc.setTextColor(150);
    doc.text('Bye', pos.x + 2, pos.y + pos.height / 2 + 1.5);
    doc.setTextColor(0);
    return;
  }

  if (pos.participantName) {
    // Seed number
    if (pos.seed) {
      setFont(doc, SIZE.TINY, STYLE.BOLD);
      doc.text(`[${pos.seed}]`, pos.x + 1, pos.y + pos.height / 2 + 1);
      setFont(doc, SIZE.SMALL, STYLE.NORMAL);
      doc.text(pos.participantName, pos.x + 9, pos.y + pos.height / 2 + 1);
    } else {
      setFont(doc, SIZE.SMALL, STYLE.NORMAL);
      doc.text(pos.participantName, pos.x + 2, pos.y + pos.height / 2 + 1);
    }

    // Nationality on right
    if (pos.nationality) {
      setFont(doc, SIZE.TINY, STYLE.NORMAL);
      doc.setTextColor(100);
      doc.text(pos.nationality, pos.x + pos.width - 2, pos.y + pos.height / 2 + 1, { align: 'right' });
      doc.setTextColor(0);
    }
  }
}

export function drawBracketConnectors(doc: jsPDF, positions: BracketPosition[][], config: BracketConfig) {
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);

  for (let round = 0; round < positions.length - 1; round++) {
    const currentRound = positions[round];
    const nextRound = positions[round + 1];

    for (let i = 0; i < currentRound.length; i += 2) {
      const top = currentRound[i];
      const bottom = currentRound[i + 1];
      const nextSlot = nextRound[Math.floor(i / 2)];

      if (!top || !bottom || !nextSlot) continue;

      const rightX = top.x + top.width;
      const midX = rightX + config.roundGap / 2;
      const topMidY = top.y + top.height / 2;
      const bottomMidY = bottom.y + bottom.height / 2;
      const nextMidY = nextSlot.y + nextSlot.height / 2;

      // Horizontal from top slot
      doc.line(rightX, topMidY, midX, topMidY);
      // Horizontal from bottom slot
      doc.line(rightX, bottomMidY, midX, bottomMidY);
      // Vertical connector
      doc.line(midX, topMidY, midX, bottomMidY);
      // Horizontal to next round
      doc.line(midX, nextMidY, nextSlot.x, nextMidY);
    }
  }
}

export function drawScore(doc: jsPDF, score: string, x: number, y: number) {
  setFont(doc, SIZE.TINY, STYLE.NORMAL);
  doc.setTextColor(60, 60, 180);
  doc.text(score, x, y);
  doc.setTextColor(0);
}
