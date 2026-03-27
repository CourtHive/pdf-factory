import jsPDF from 'jspdf';
import { setFont, SIZE, STYLE } from './fonts';

export interface TournamentHeader {
  tournamentName: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  organizer?: string;
  subtitle?: string;
}

export function drawTournamentHeader(doc: jsPDF, header: TournamentHeader, startY: number = 15): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = startY;

  // Tournament name
  setFont(doc, SIZE.TITLE, STYLE.BOLD);
  doc.text(header.tournamentName, margin, y);
  y += 7;

  // Subtitle (e.g., "Boys Singles - Main Draw")
  if (header.subtitle) {
    setFont(doc, SIZE.SUBTITLE, STYLE.BOLD);
    doc.text(header.subtitle, margin, y);
    y += 6;
  }

  // Date and location on the right
  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  const infoLines: string[] = [];

  if (header.startDate) {
    const dateStr = header.endDate ? `${header.startDate} - ${header.endDate}` : header.startDate;
    infoLines.push(dateStr);
  }
  if (header.location) infoLines.push(header.location);
  if (header.organizer) infoLines.push(header.organizer);

  infoLines.forEach((line, i) => {
    doc.text(line, pageWidth - margin, startY + i * 4, { align: 'right' });
  });

  // Separator line
  y += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  return y;
}

export function drawPageFooter(doc: jsPDF, text: string, pageNumber?: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  setFont(doc, SIZE.SMALL, STYLE.ITALIC);
  doc.setTextColor(120);
  doc.text(text, margin, pageHeight - 10);

  if (pageNumber !== undefined) {
    doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  doc.setTextColor(0);
}
