/**
 * Professional Order of Play / Schedule PDF generator.
 *
 * Modeled after the ITF J300 reference OOP:
 * - Courts as columns, time slots as numbered rows
 * - 3-zone cell: event/round header, player names with nationalities, score footer
 * - "Not Before" and "Starting at" time labels
 * - Landscape for 5+ courts, portrait for fewer
 * - Professional header with tournament info and "ORDER OF PLAY" title
 * - Footer with notes, officials, timestamp
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ScheduleData, ScheduleMatch } from '../core/extractScheduleData';
import type { HeaderConfig, FooterConfig, PageConfig } from '../config/types';
import { renderHeader } from '../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../composition/footerLayouts';
import { createDoc } from '../composition/page';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface OrderOfPlayOptions {
  header?: HeaderConfig;
  footer?: FooterConfig;
  page?: Partial<PageConfig>;
  alertBanner?: string;
  notes?: string[];
  officials?: { role: string; name: string }[];
  showMatchNumbers?: boolean;
  cellStyle?: 'detailed' | 'compact';
}

export function generateOrderOfPlayPDF(scheduleData: ScheduleData, options: OrderOfPlayOptions = {}): jsPDF {
  const courts = scheduleData.courts;
  const autoLandscape = courts.length >= 4;
  const pageConfig: PageConfig = {
    pageSize: options.page?.pageSize || 'a4',
    orientation: options.page?.orientation || (autoLandscape ? 'landscape' : 'portrait'),
    margins: options.page?.margins || { top: 12, right: 8, bottom: 10, left: 8 },
  };

  const doc = createDoc(pageConfig);
  const footerConfig: FooterConfig = options.footer || {
    layout: 'standard',
    showTimestamp: true,
    showPageNumbers: true,
  };
  const footerH = measureFooterHeight(footerConfig) + (options.notes?.length ? options.notes.length * 3 : 0);

  let startY = pageConfig.margins.top;

  // Header
  if (options.header) {
    const headerH = renderHeader(doc, options.header, pageConfig);
    startY = pageConfig.margins.top + headerH;
  }

  // Alert banner (red background, white text)
  if (options.alertBanner) {
    startY = renderAlertBanner(doc, options.alertBanner, pageConfig, startY);
  }

  // Build the schedule table
  const tableStartY = startY;
  renderScheduleTable(doc, scheduleData, pageConfig, tableStartY, options);

  // Notes section above footer
  const pageHeight = doc.internal.pageSize.getHeight();
  if (options.notes?.length) {
    let notesY = pageHeight - pageConfig.margins.bottom - footerH + 2;
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(80);
    for (const note of options.notes) {
      doc.text(note, pageConfig.margins.left, notesY);
      notesY += 3;
    }
    doc.setTextColor(0);
  }

  // Officials row
  if (options.officials?.length) {
    const officialsY = pageHeight - pageConfig.margins.bottom - 6;
    renderOfficialsRow(doc, options.officials, pageConfig, officialsY);
  }

  // Footer
  renderFooter(doc, footerConfig, pageConfig, 1);

  return doc;
}

function renderAlertBanner(doc: jsPDF, text: string, pageConfig: PageConfig, y: number): number {
  const { margins } = pageConfig;
  const pageWidth = doc.internal.pageSize.getWidth();
  const bannerWidth = pageWidth - margins.left - margins.right;

  doc.setFillColor(200, 30, 30);
  doc.rect(margins.left, y, bannerWidth, 7, 'F');

  setFont(doc, SIZE.SMALL, STYLE.BOLD);
  doc.setTextColor(255, 255, 255);
  doc.text(text, pageWidth / 2, y + 4.5, { align: 'center' });
  doc.setTextColor(0);

  return y + 9;
}

function renderScheduleTable(
  doc: jsPDF,
  scheduleData: ScheduleData,
  pageConfig: PageConfig,
  startY: number,
  options: OrderOfPlayOptions,
): void {
  const { margins } = pageConfig;
  const courts = scheduleData.courts;
  const isCompact = options.cellStyle === 'compact';

  // Build column definitions: slot # + one column per court
  const columns: any[] = [{ header: '', dataKey: 'slot' }];
  for (const court of courts) {
    columns.push({ header: court, dataKey: court });
  }

  // Build rows: one per time slot
  const body: any[][] = [];

  scheduleData.timeSlots.forEach((slot, slotIdx) => {
    const row: any[] = [];

    // Slot number + time label
    const timeLabel = buildTimeLabel(slot, slotIdx);
    row.push({ content: timeLabel, styles: { fontStyle: 'bold', valign: 'top', cellWidth: 12 } });

    // One cell per court
    for (const court of courts) {
      const courtMatches = slot.matches.filter((m) => m.courtName === court);
      const cellContent =
        courtMatches.length > 0 ? courtMatches.map((m) => formatCellContent(m, isCompact)).join('\n---\n') : '';
      row.push(cellContent);
    }

    body.push(row);
  });

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header)],
    body,
    styles: {
      fontSize: isCompact ? 6 : 6.5,
      cellPadding: isCompact ? 1.5 : 2,
      lineWidth: 0.3,
      lineColor: [80, 80, 80],
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 14, fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    margin: { left: margins.left, right: margins.right },
    tableWidth: 'auto',
    didParseCell: (data) => {
      if (data.column.index > 0 && data.section === 'body') {
        // Court columns: equal width, centered text
        const availableWidth = doc.internal.pageSize.getWidth() - margins.left - margins.right - 14;
        data.cell.styles.cellWidth = availableWidth / courts.length;
        data.cell.styles.halign = 'center';
        data.cell.styles.valign = 'middle';
      }
    },
  });
}

function buildTimeLabel(_slot: any, slotIdx: number): string {
  return `${slotIdx + 1}`;
}

function formatCellContent(match: ScheduleMatch, isCompact: boolean): string {
  const lines: string[] = [];

  // Scheduling info (per-match time details)
  if (match.notBeforeTime) {
    lines.push(`NB ${match.notBeforeTime}`);
  } else if (match.scheduledTime) {
    lines.push(match.scheduledTime);
  }

  // Event + Round (header zone)
  if (match.eventAbbr || match.roundName) {
    lines.push(`${match.eventAbbr} ${match.roundName}`.trim());
  }

  // Player 1
  const p1 = formatPlayer(match.side1, isCompact);
  if (p1) lines.push(p1);

  // "vs." divider
  lines.push('vs.');

  // Player 2
  const p2 = formatPlayer(match.side2, isCompact);
  if (p2) lines.push(p2);

  // Score or status (footer zone)
  if (match.score) {
    lines.push(match.score);
  } else if (match.matchUpStatus === 'IN_PROGRESS') {
    lines.push('In progress');
  }

  return lines.join('\n');
}

function formatPlayer(side: { name: string; nationality: string }, isCompact: boolean): string {
  if (!side.name) return 'TBD';
  if (isCompact) return `${side.name} (${side.nationality})`;
  return side.nationality ? `${side.name} (${side.nationality})` : side.name;
}

function renderOfficialsRow(
  doc: jsPDF,
  officials: { role: string; name: string }[],
  pageConfig: PageConfig,
  y: number,
): void {
  const { margins } = pageConfig;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setDrawColor(120);
  doc.setLineWidth(0.2);
  doc.line(margins.left, y - 2, pageWidth - margins.right, y - 2);

  setFont(doc, SIZE.TINY, STYLE.NORMAL);
  const spacing = (pageWidth - margins.left - margins.right) / officials.length;

  officials.forEach((official, i) => {
    const x = margins.left + i * spacing;
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(100);
    doc.text(official.role, x, y);
    setFont(doc, SIZE.TINY, STYLE.BOLD);
    doc.setTextColor(0);
    doc.text(official.name, x, y + 3);
  });
}
