import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawTournamentHeader, type TournamentHeader } from '../layout/headers';
import { setFont, SIZE, STYLE } from '../layout/fonts';
import type { ParticipantRow } from '../core/extractParticipantData';

export interface SignInSheetOptions {
  header?: TournamentHeader;
  eventName?: string;
  signInDate?: string;
  signInTime?: string;
}

export function generateSignInSheetPDF(players: ParticipantRow[], options: SignInSheetOptions = {}): jsPDF {
  const { header, eventName, signInDate, signInTime } = options;
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
  let startY = 15;

  if (header) {
    startY = drawTournamentHeader(doc, { ...header, subtitle: header.subtitle || 'Player Sign-In Sheet' });
  }

  // Event/date info
  if (eventName || signInDate) {
    setFont(doc, SIZE.BODY, STYLE.NORMAL);
    const infoLine: string[] = [];
    if (eventName) infoLine.push(`Event: ${eventName}`);
    if (signInDate) infoLine.push(`Date: ${signInDate}`);
    if (signInTime) infoLine.push(`Time: ${signInTime}`);
    doc.text(infoLine.join('   |   '), 15, startY);
    startY += 6;
  }

  const columns = [
    { header: '#', dataKey: 'index' },
    { header: 'Player Name', dataKey: 'name' },
    { header: 'Nat.', dataKey: 'nationality' },
    { header: 'Rank', dataKey: 'ranking' },
    { header: 'Seed', dataKey: 'seed' },
    { header: 'Entry', dataKey: 'entry' },
    { header: 'Signature', dataKey: 'signature' },
    { header: 'Time', dataKey: 'time' },
  ];

  const body = players.map((p, i) => ({
    index: i + 1,
    name: p.name,
    nationality: p.nationality,
    ranking: p.ranking || '',
    seed: p.seedValue?.toString() || '',
    entry: p.entryStatus,
    signature: '',
    time: '',
  }));

  autoTable(doc, {
    startY,
    columns,
    body,
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      lineWidth: 0.2,
      lineColor: [150, 150, 150],
    },
    headStyles: {
      fillColor: [40, 60, 100],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      index: { cellWidth: 10, halign: 'center' },
      name: { cellWidth: 'auto', fontStyle: 'bold' },
      nationality: { cellWidth: 14, halign: 'center' },
      ranking: { cellWidth: 14, halign: 'center' },
      seed: { cellWidth: 14, halign: 'center' },
      entry: { cellWidth: 14, halign: 'center' },
      signature: { cellWidth: 35 },
      time: { cellWidth: 15 },
    },
  });

  return doc;
}
