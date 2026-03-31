import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawTournamentHeader, drawPageFooter, type TournamentHeader } from '../layout/headers';
import { TABLE_STYLES } from '../layout/tables';
import { setFont, SIZE, STYLE } from '../layout/fonts';
import {
  calculateBracketPositions,
  drawBracketSlot,
  drawBracketConnectors,
  drawScore,
  type BracketConfig,
  DEFAULT_BRACKET_CONFIG,
} from '../layout/brackets';
import { getRoundLabel, type DrawData } from '../core/extractDrawData';

export interface DrawSheetOptions {
  header?: TournamentHeader;
  includeSeedings?: boolean;
  includeScores?: boolean;
}

export function generateDrawSheetPDF(drawData: DrawData, options: DrawSheetOptions = {}): jsPDF {
  const { header, includeSeedings = true, includeScores = true } = options;

  // Landscape for 32+ draws to fit bracket width
  const landscape = drawData.drawSize >= 32;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', format: 'a4' });

  let startY = 15;
  if (header) {
    const subtitle = `${drawData.drawName} - ${drawData.drawType.replace(/_/g, ' ')} (${drawData.drawSize})`;
    startY = drawTournamentHeader(doc, { ...header, subtitle });
  }

  // For small draws (<=16), draw the bracket directly
  if (drawData.drawSize <= 64 && drawData.drawSize > 0) {
    startY = drawBracket(doc, drawData, startY, includeScores);
  } else {
    // For very large draws, fall back to tabular format
    startY = drawTabularDraw(doc, drawData, startY);
  }

  // Seeded players table
  if (includeSeedings && drawData.seedAssignments.length > 0) {
    drawSeedingsTable(doc, drawData, startY + 8);
  }

  drawPageFooter(doc, `Generated ${new Date().toLocaleDateString()}`);

  return doc;
}

function drawBracket(doc: jsPDF, drawData: DrawData, startY: number, includeScores: boolean): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Calculate config based on draw size and available space
  const availableWidth = pageWidth - 30;
  const availableHeight = pageHeight - startY - 30;
  const totalRounds = drawData.totalRounds;

  const slotWidth = Math.min(90, (availableWidth - totalRounds * 10) / totalRounds);
  const slotHeight = Math.min(14, availableHeight / drawData.drawSize);

  const config: BracketConfig = {
    ...DEFAULT_BRACKET_CONFIG,
    slotWidth,
    slotHeight,
    verticalGap: Math.max(1, slotHeight * 0.3),
    startX: 15,
    startY,
  };

  const positions = calculateBracketPositions(drawData.drawSize, config, availableHeight);

  // Fill positions with participant data
  const slotMap = new Map(drawData.slots.map((s) => [s.drawPosition, s]));

  // Round headers
  setFont(doc, SIZE.SMALL, STYLE.BOLD);
  for (let round = 0; round < totalRounds; round++) {
    const x = config.startX + round * (config.slotWidth + config.roundGap);
    const label = getRoundLabel(round + 1, totalRounds);
    doc.text(label, x + config.slotWidth / 2, startY - 2, { align: 'center' });
  }

  // Draw first round slots with participant names
  if (positions.length > 0) {
    const firstRound = positions[0];
    for (let i = 0; i < firstRound.length; i++) {
      const drawPosition = i + 1;
      const slot = slotMap.get(drawPosition);
      if (slot) {
        firstRound[i].participantName = slot.participantName;
        firstRound[i].nationality = slot.nationality;
        firstRound[i].seed = slot.seedValue;
        firstRound[i].isBye = slot.isBye;
      }
    }

    // Draw slots for each round
    for (const round of positions) {
      for (const pos of round) {
        drawBracketSlot(doc, pos);
      }
    }

    // Draw connector lines
    drawBracketConnectors(doc, positions, config);

    // Draw scores on connectors
    if (includeScores) {
      for (const mu of drawData.matchUps) {
        if (!mu.score) continue;
        const roundIdx = mu.roundNumber - 1;
        if (roundIdx < positions.length) {
          const matchIdx = (mu.roundPosition - 1) * 2;
          const pos = positions[roundIdx]?.[matchIdx];
          if (pos) {
            drawScore(doc, mu.score, pos.x + pos.width + 2, pos.y + pos.height + 3);
          }
        }
      }
    }

    // Return bottom of bracket
    const lastRoundBottom = positions[0][positions[0].length - 1];
    return lastRoundBottom.y + lastRoundBottom.height + 5;
  }

  return startY;
}

function drawTabularDraw(doc: jsPDF, drawData: DrawData, startY: number): number {
  const columns = [
    { header: 'Pos', dataKey: 'pos' },
    { header: 'Seed', dataKey: 'seed' },
    { header: 'Player', dataKey: 'name' },
    { header: 'Nat.', dataKey: 'nat' },
    { header: 'Entry', dataKey: 'entry' },
  ];

  const body = drawData.slots.map((s) => ({
    pos: s.drawPosition,
    seed: s.seedValue?.toString() || '',
    name: s.isBye ? 'Bye' : s.participantName,
    nat: s.nationality,
    entry: s.entryStatus || '',
  }));

  autoTable(doc, {
    ...TABLE_STYLES.compact,
    startY,
    columns,
    body,
    columnStyles: {
      pos: { cellWidth: 12, halign: 'center' },
      seed: { cellWidth: 12, halign: 'center' },
      name: { cellWidth: 'auto' },
      nat: { cellWidth: 15, halign: 'center' },
      entry: { cellWidth: 15, halign: 'center' },
    },
  });

  return (doc as any).lastAutoTable?.finalY || startY + 20;
}

function drawSeedingsTable(doc: jsPDF, drawData: DrawData, startY: number): number {
  setFont(doc, SIZE.HEADING, STYLE.BOLD);
  doc.text('Seeded Players', 15, startY);
  startY += 4;

  const columns = [
    { header: 'Seed', dataKey: 'seed' },
    { header: 'Player', dataKey: 'name' },
    { header: 'Nat.', dataKey: 'nat' },
  ];

  const body = drawData.seedAssignments.map((s) => ({
    seed: s.seedValue,
    name: s.participantName,
    nat: s.nationality,
  }));

  autoTable(doc, {
    ...TABLE_STYLES.compact,
    startY,
    columns,
    body,
    tableWidth: 120,
    columnStyles: {
      seed: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      name: { cellWidth: 'auto' },
      nat: { cellWidth: 20, halign: 'center' },
    },
  });

  return (doc as any).lastAutoTable?.finalY || startY + 20;
}
