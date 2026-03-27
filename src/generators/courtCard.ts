import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { setFont, SIZE, STYLE } from '../layout/fonts';
import type { CourtCardData } from '../core/extractCourtCardData';

export interface CourtCardOptions {
  tournamentName?: string;
  pageSize?: 'a4' | 'a5' | 'letter';
  cardsPerPage?: number;
}

export function generateCourtCardPDF(cards: CourtCardData[], options: CourtCardOptions = {}): jsPDF {
  const { tournamentName = '', pageSize = 'a5', cardsPerPage = 1 } = options;
  const doc = new jsPDF({ orientation: 'landscape', format: pageSize });

  cards.forEach((card, index) => {
    if (index > 0) doc.addPage();
    drawCourtCard(doc, card, tournamentName, cardsPerPage);
  });

  return doc;
}

function drawCourtCard(doc: jsPDF, card: CourtCardData, tournamentName: string, _cardsPerPage: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  let y = 15;

  // Tournament name (small, top)
  if (tournamentName) {
    setFont(doc, SIZE.BODY, STYLE.NORMAL);
    doc.setTextColor(100);
    doc.text(tournamentName, centerX, y, { align: 'center' });
    doc.setTextColor(0);
    y += 8;
  }

  // Court name (large, prominent)
  setFont(doc, 28, STYLE.BOLD);
  doc.text(card.courtName, centerX, y, { align: 'center' });
  y += 5;

  if (card.venueName) {
    setFont(doc, SIZE.HEADING, STYLE.NORMAL);
    doc.setTextColor(100);
    doc.text(card.venueName, centerX, y, { align: 'center' });
    doc.setTextColor(0);
  }
  y += 8;

  // Separator
  doc.setDrawColor(0);
  doc.setLineWidth(1);
  doc.line(30, y, pageWidth - 30, y);
  y += 8;

  // Current match
  if (card.currentMatch) {
    setFont(doc, SIZE.HEADING, STYLE.BOLD);
    doc.setTextColor(30, 60, 120);
    doc.text('NOW PLAYING', centerX, y, { align: 'center' });
    doc.setTextColor(0);
    y += 6;

    setFont(doc, SIZE.BODY, STYLE.ITALIC);
    doc.text(`${card.currentMatch.eventName} - ${card.currentMatch.roundName}`, centerX, y, { align: 'center' });
    y += 8;

    // Player names - large
    autoTable(doc, {
      startY: y,
      margin: { left: 25, right: 25 },
      theme: 'plain',
      styles: { halign: 'center', fontSize: 16, cellPadding: 4 },
      body: [
        [
          {
            content: `${card.currentMatch.side1.name}  (${card.currentMatch.side1.nationality})`,
            styles: { fontStyle: 'bold' },
          },
        ],
        [{ content: 'vs.', styles: { fontSize: 12, textColor: [120, 120, 120] } }],
        [
          {
            content: `${card.currentMatch.side2.name}  (${card.currentMatch.side2.nationality})`,
            styles: { fontStyle: 'bold' },
          },
        ],
      ],
    });

    y = (doc as any).lastAutoTable?.finalY || y + 40;
    y += 8;
  }

  // Next match
  if (card.nextMatch) {
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(50, y, pageWidth - 50, y);
    y += 6;

    setFont(doc, SIZE.BODY, STYLE.BOLD);
    doc.setTextColor(100);
    const upNextLabel = card.nextMatch.scheduledTime ? `UP NEXT (${card.nextMatch.scheduledTime})` : 'UP NEXT';
    doc.text(upNextLabel, centerX, y, { align: 'center' });
    doc.setTextColor(0);
    y += 5;

    setFont(doc, SIZE.BODY, STYLE.NORMAL);
    doc.text(`${card.nextMatch.eventName} - ${card.nextMatch.roundName}`, centerX, y, { align: 'center' });
    y += 5;

    setFont(doc, SIZE.HEADING, STYLE.NORMAL);
    doc.text(`${card.nextMatch.side1.name} vs. ${card.nextMatch.side2.name}`, centerX, y, { align: 'center' });
  }
}
