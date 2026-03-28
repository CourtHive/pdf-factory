import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PageRegions, DrawFormatConfig } from '../config/types';
import type { RoundRobinGroupData } from '../core/extractRoundRobinData';
import { formatMatchScore } from './formatEntry';
import { setFont, SIZE, STYLE } from '../layout/fonts';

const GRAY_FILL: [number, number, number] = [200, 200, 200];
const WIN_COLOR: [number, number, number] = [20, 80, 20];
const LOSS_COLOR: [number, number, number] = [160, 40, 40];
const HEADER_FILL: [number, number, number] = [50, 50, 50];

export function renderRoundRobinGroup(
  doc: jsPDF,
  group: RoundRobinGroupData,
  format: DrawFormatConfig,
  regions: PageRegions,
  startY: number,
): number {
  const margins = format.page.margins;
  const count = group.participants.length;

  // Group title
  setFont(doc, SIZE.HEADING, STYLE.BOLD);
  doc.text(group.groupName, margins.left, startY);
  startY += 5;

  // Build the grid: rows = participants, cols = # + Name + Nat + each opponent + W + L
  const headerRow = ['#', 'Player', 'Nat.'];
  for (let i = 0; i < count; i++) {
    headerRow.push(`${i + 1}`);
  }
  headerRow.push('W', 'L');

  // Build result matrix
  const resultMatrix = buildResultMatrix(group, format);

  // Build table body
  const body: any[][] = group.participants.map((p, rowIdx) => {
    const row: any[] = [
      { content: `${rowIdx + 1}`, styles: { fontStyle: 'bold', halign: 'center' } },
      { content: p.participantName + (p.seedValue ? ` [${p.seedValue}]` : ''), styles: { fontStyle: 'bold' } },
      { content: p.nationality, styles: { halign: 'center' } },
    ];

    // Score cells for each opponent
    for (let colIdx = 0; colIdx < count; colIdx++) {
      if (rowIdx === colIdx) {
        // Self-intersection: grayed out
        row.push({ content: '', styles: { fillColor: GRAY_FILL } });
      } else {
        const cell = resultMatrix[rowIdx]?.[colIdx];
        if (cell) {
          const textColor = cell.isWin ? WIN_COLOR : LOSS_COLOR;
          row.push({ content: cell.score, styles: { halign: 'center', textColor } });
        } else {
          row.push({ content: '', styles: { halign: 'center' } });
        }
      }
    }

    // Win/Loss counts
    const wins = resultMatrix[rowIdx]?.filter((c) => c?.isWin).length || 0;
    const losses = resultMatrix[rowIdx]?.filter((c) => c && !c.isWin).length || 0;
    row.push({ content: `${wins}`, styles: { halign: 'center', fontStyle: 'bold' } });
    row.push({ content: `${losses}`, styles: { halign: 'center' } });

    return row;
  });

  autoTable(doc, {
    startY,
    head: [headerRow],
    body,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      lineWidth: 0.2,
      lineColor: [150, 150, 150],
    },
    headStyles: {
      fillColor: HEADER_FILL,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 12 },
    },
    margin: { left: margins.left, right: margins.right },
  });

  return (doc as any).lastAutoTable?.finalY || startY + 40;
}

interface CellResult {
  score: string;
  isWin: boolean;
}

function buildResultMatrix(group: RoundRobinGroupData, format: DrawFormatConfig): (CellResult | null)[][] {
  const count = group.participants.length;
  const matrix: (CellResult | null)[][] = Array.from({ length: count }, () => Array(count).fill(null));

  // Map group positions to matrix indices
  const posToIdx = new Map<number, number>();
  group.participants.forEach((p, i) => posToIdx.set(p.groupPosition, i));

  for (const result of group.results) {
    const rowIdx = posToIdx.get(result.rowPosition);
    const colIdx = posToIdx.get(result.colPosition);
    if (rowIdx === undefined || colIdx === undefined) continue;

    const score = formatMatchScore(result.score, format);
    const isRowWinner = result.winningSide === 1;

    // Row player's perspective
    matrix[rowIdx][colIdx] = { score, isWin: isRowWinner };
    // Column player's perspective (reversed score)
    matrix[colIdx][rowIdx] = { score: reverseScore(score), isWin: !isRowWinner };
  }

  return matrix;
}

function reverseScore(score: string): string {
  // Reverse set scores: "6-4 3-6" -> "4-6 6-3"
  return score
    .split(/\s+/)
    .map((set) => {
      const match = set.match(/^(\d+)([/-])(\d+)(\(\d+\))?$/);
      if (match) return `${match[3]}${match[2]}${match[1]}${match[4] || ''}`;
      return set;
    })
    .join(' ');
}
