import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawTournamentHeader, drawPageFooter, type TournamentHeader } from '../layout/headers';
import { TABLE_STYLES } from '../layout/tables';
import { setFont, SIZE, STYLE } from '../layout/fonts';
import type { ScheduleData } from '../core/extractScheduleData';

export interface ScheduleOptions {
  header?: TournamentHeader;
  landscape?: boolean | 'auto';
  fullCourtNames?: boolean;
  notes?: string[];
}

export function generateSchedulePDF(scheduleData: ScheduleData, options: ScheduleOptions = {}): jsPDF {
  const { header, fullCourtNames = true, notes } = options;

  const autoLandscape = options.landscape === 'auto' ? scheduleData.courts.length >= 5 : options.landscape;
  const orientation = autoLandscape ? 'landscape' : 'portrait';

  const doc = new jsPDF({ orientation, format: 'a4' });
  let startY = 15;

  if (header) {
    const subtitle = scheduleData.scheduledDate ? `Order of Play - ${scheduleData.scheduledDate}` : 'Order of Play';
    startY = drawTournamentHeader(doc, { ...header, subtitle });
  }

  const courts = scheduleData.courts;
  const courtHeaders = fullCourtNames ? courts : courts.map(abbrevCourt);

  for (const timeSlot of scheduleData.timeSlots) {
    // Time slot label
    setFont(doc, SIZE.BODY, STYLE.BOLD);
    doc.setTextColor(30, 60, 120);
    doc.text(timeSlot.label, 15, startY);
    doc.setTextColor(0);
    startY += 4;

    // Build table: one column per court
    const columns = courtHeaders.map((name) => ({ header: name, dataKey: name }));

    // Group matches by court for this time slot
    const courtMatches = new Map<string, string[]>();
    courts.forEach((c) => courtMatches.set(c, []));

    for (const match of timeSlot.matches) {
      const content = formatMatchCell(match);
      const existing = courtMatches.get(match.courtName) || [];
      existing.push(content);
      courtMatches.set(match.courtName, existing);
    }

    // Find max rows needed
    const maxRows = Math.max(1, ...Array.from(courtMatches.values()).map((v) => v.length));

    const body: Record<string, string>[] = [];
    for (let row = 0; row < maxRows; row++) {
      const rowData: Record<string, string> = {};
      courts.forEach((court, i) => {
        const matches = courtMatches.get(court) || [];
        const key = fullCourtNames ? court : courtHeaders[i];
        rowData[key] = matches[row] || '';
      });
      body.push(rowData);
    }

    autoTable(doc, {
      ...TABLE_STYLES.schedule,
      startY,
      columns,
      body,
      tableWidth: 'auto',
      didDrawPage: (data) => {
        drawPageFooter(doc, header?.tournamentName || '', data.pageNumber);
      },
    });

    startY = (doc as any).lastAutoTable?.finalY + 6 || startY + 20;
  }

  // Notes section
  if (notes?.length) {
    startY += 4;
    setFont(doc, SIZE.SMALL, STYLE.ITALIC);
    doc.setTextColor(80);
    for (const note of notes) {
      doc.text(note, 15, startY);
      startY += 4;
    }
    doc.setTextColor(0);
  }

  return doc;
}

function formatMatchCell(match: any): string {
  const lines: string[] = [];
  lines.push(`${match.eventAbbr} ${match.roundName}`);
  lines.push(`${match.side1.name} (${match.side1.nationality})`);
  lines.push(`vs ${match.side2.name} (${match.side2.nationality})`);
  if (match.score) lines.push(match.score);
  return lines.join('\n');
}

function abbrevCourt(name: string): string {
  return name.replace(/^Court\s*/i, 'Ct ');
}
