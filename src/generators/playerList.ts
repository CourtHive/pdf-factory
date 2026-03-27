import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawTournamentHeader, drawPageFooter, type TournamentHeader } from '../layout/headers';
import { TABLE_STYLES } from '../layout/tables';
import type { ParticipantRow } from '../core/extractParticipantData';

export interface PlayerListOptions {
  header?: TournamentHeader;
  includeRanking?: boolean;
  includeEvents?: boolean;
  groupByEvent?: boolean;
}

export function generatePlayerListPDF(players: ParticipantRow[], options: PlayerListOptions = {}): jsPDF {
  const { header, includeRanking = true, includeEvents = true } = options;

  const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
  let startY = 15;

  if (header) {
    startY = drawTournamentHeader(doc, { ...header, subtitle: header.subtitle || 'Player List' });
  }

  const columns: any[] = [
    { header: '#', dataKey: 'index' },
    { header: 'Name', dataKey: 'name' },
    { header: 'Nat.', dataKey: 'nationality' },
  ];

  if (includeRanking) columns.push({ header: 'Rank', dataKey: 'ranking' });
  columns.push({ header: 'Seed', dataKey: 'seed' });
  columns.push({ header: 'Entry', dataKey: 'entryStatus' });
  if (includeEvents) columns.push({ header: 'Events', dataKey: 'events' });

  const body = players.map((p, i) => ({
    index: i + 1,
    name: p.name,
    nationality: p.nationality,
    ranking: p.ranking || '',
    seed: p.seedValue?.toString() || '',
    entryStatus: p.entryStatus,
    events: p.events.join(', '),
  }));

  autoTable(doc, {
    ...TABLE_STYLES.playerList,
    startY,
    columns,
    body,
    columnStyles: {
      index: { cellWidth: 10, halign: 'center' },
      name: { cellWidth: 'auto', fontStyle: 'bold' },
      nationality: { cellWidth: 15, halign: 'center' },
      ranking: { cellWidth: 15, halign: 'center' },
      seed: { cellWidth: 12, halign: 'center' },
      entryStatus: { cellWidth: 15, halign: 'center' },
      events: { cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      drawPageFooter(doc, `Generated ${new Date().toLocaleDateString()}`, data.pageNumber);
    },
  });

  return doc;
}
