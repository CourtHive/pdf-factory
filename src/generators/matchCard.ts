import jsPDF from 'jspdf';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface MatchCardData {
  tournamentName?: string;
  eventName: string;
  roundName: string;
  matchUpId?: string;
  courtName?: string;
  scheduledTime?: string;
  side1: { name: string; nationality: string; seedValue?: number };
  side2: { name: string; nationality: string; seedValue?: number };
}

export interface MatchCardOptions {
  cardsPerPage?: number;
  includeScoreBoxes?: boolean;
}

export function generateMatchCardPDF(matches: MatchCardData[], options: MatchCardOptions = {}): jsPDF {
  const { cardsPerPage = 2, includeScoreBoxes = true } = options;
  const doc = new jsPDF({ orientation: 'landscape', format: 'a5' });

  matches.forEach((match, index) => {
    if (index > 0) {
      if (cardsPerPage === 1 || index % cardsPerPage === 0) {
        doc.addPage();
      }
    }

    const offsetY = cardsPerPage === 2 && index % 2 === 1 ? doc.internal.pageSize.getHeight() / 2 : 5;
    renderMatchCard(doc, match, offsetY, includeScoreBoxes);
  });

  return doc;
}

function renderMatchCard(doc: jsPDF, match: MatchCardData, startY: number, includeScoreBoxes: boolean) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  const margin = 10;
  let y = startY;

  // Tournament name
  if (match.tournamentName) {
    setFont(doc, SIZE.BODY, STYLE.NORMAL);
    doc.setTextColor(100);
    doc.text(match.tournamentName, centerX, y, { align: 'center' });
    doc.setTextColor(0);
    y += 5;
  }

  // Event + Round
  setFont(doc, SIZE.HEADING, STYLE.BOLD);
  doc.text(`${match.eventName} - ${match.roundName}`, centerX, y, { align: 'center' });
  y += 5;

  // Court + Time
  if (match.courtName || match.scheduledTime) {
    setFont(doc, SIZE.BODY, STYLE.NORMAL);
    const info: string[] = [];
    if (match.courtName) info.push(`Court: ${match.courtName}`);
    if (match.scheduledTime) info.push(`Time: ${match.scheduledTime}`);
    doc.text(info.join('     '), centerX, y, { align: 'center' });
    y += 5;
  }

  // Separator
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Player 1
  renderPlayerLine(doc, match.side1, margin, y, pageWidth);
  y += 8;

  // vs
  setFont(doc, SIZE.BODY, STYLE.ITALIC);
  doc.setTextColor(120);
  doc.text('vs.', centerX, y, { align: 'center' });
  doc.setTextColor(0);
  y += 6;

  // Player 2
  renderPlayerLine(doc, match.side2, margin, y, pageWidth);
  y += 8;

  // Score boxes
  if (includeScoreBoxes) {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    setFont(doc, SIZE.SMALL, STYLE.BOLD);
    doc.text('Score:', margin, y);

    const boxWidth = 12;
    const boxHeight = 8;
    const boxStartX = margin + 18;
    const boxGap = 3;

    // 5 set boxes (3 for best-of-3, 5 for best-of-5)
    for (let i = 0; i < 5; i++) {
      const bx = boxStartX + i * (boxWidth + boxGap);
      doc.rect(bx, y - 4, boxWidth, boxHeight);
      // Set number label above
      setFont(doc, SIZE.TINY, STYLE.NORMAL);
      doc.setTextColor(150);
      doc.text(`Set ${i + 1}`, bx + boxWidth / 2, y - 5, { align: 'center' });
      doc.setTextColor(0);
    }

    y += boxHeight + 6;

    // Umpire signature line
    setFont(doc, SIZE.SMALL, STYLE.NORMAL);
    doc.text('Umpire:', margin, y);
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, y, margin + 80, y);

    doc.text('Signature:', pageWidth - margin - 70, y);
    doc.line(pageWidth - margin - 40, y, pageWidth - margin, y);
  }
}

function renderPlayerLine(
  doc: jsPDF,
  side: { name: string; nationality: string; seedValue?: number },
  margin: number,
  y: number,
  pageWidth: number,
): void {
  setFont(doc, 14, STYLE.BOLD);
  const seed = side.seedValue ? `[${side.seedValue}] ` : '';
  doc.text(`${seed}${side.name}`, margin, y);

  setFont(doc, SIZE.HEADING, STYLE.NORMAL);
  doc.setTextColor(80);
  doc.text(side.nationality, pageWidth - margin, y, { align: 'right' });
  doc.setTextColor(0);
}
