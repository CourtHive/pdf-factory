import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawTournamentHeader, drawPageFooter, type TournamentHeader } from '../layout/headers';
import { TABLE_STYLES } from '../layout/tables';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface ReportColumn {
  key: string;
  title: string;
  type?: 'string' | 'number' | 'boolean' | 'date';
  width?: number;
}

export interface ReportPDFOptions {
  header?: TournamentHeader;
  orientation?: 'portrait' | 'landscape';
  title?: string;
}

export function generateReportPDF(
  columns: ReportColumn[],
  rows: Record<string, any>[],
  options: ReportPDFOptions = {},
): jsPDF {
  const orientation = options.orientation || 'portrait';
  const doc = new jsPDF({ orientation, format: 'a4' });
  let startY = 15;

  if (options.header) {
    startY = drawTournamentHeader(doc, {
      ...options.header,
      subtitle: options.header.subtitle || options.title,
    });
  } else if (options.title) {
    const margin = 15;
    setFont(doc, SIZE.SUBTITLE, STYLE.BOLD);
    doc.text(options.title, margin, startY);
    startY += 8;
  }

  if (columns.length === 0) {
    setFont(doc, SIZE.BODY, STYLE.ITALIC);
    doc.text('No columns defined', 15, startY);
    drawPageFooter(doc, `Generated ${new Date().toLocaleDateString()}`, 1);
    return doc;
  }

  const tableColumns = columns.map((col) => ({
    header: col.title,
    dataKey: col.key,
  }));

  const body = rows.map((row) => {
    const mapped: Record<string, any> = {};
    for (const col of columns) {
      const val = row[col.key];
      mapped[col.key] = val != null ? String(val) : '';
    }
    return mapped;
  });

  const columnStyles: Record<string, any> = {};
  for (const col of columns) {
    if (col.type === 'number') {
      columnStyles[col.key] = { halign: 'right' };
    }
    if (col.width) {
      columnStyles[col.key] = { ...columnStyles[col.key], cellWidth: col.width };
    }
  }

  autoTable(doc, {
    ...TABLE_STYLES.report,
    startY,
    columns: tableColumns,
    body,
    columnStyles,
    didDrawPage: (data) => {
      drawPageFooter(doc, `Generated ${new Date().toLocaleDateString()}`, data.pageNumber);
    },
  });

  return doc;
}
