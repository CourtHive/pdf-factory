import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawTournamentHeader, drawPageFooter, type TournamentHeader } from '../layout/headers';
import { TABLE_STYLES } from '../layout/tables';
import { setFont, SIZE, STYLE, applyDefaultFont } from '../layout/fonts';

export interface ReportColumn {
  key: string;
  title: string;
  type?: 'string' | 'number' | 'boolean' | 'date';
  /** UI (Tabulator) hint in **pixels** — scaled to document units for the PDF. */
  width?: number;
  /** Size to content and do not absorb spare table width (columns without
   * `fitData` and without `width` take the slack). */
  fitData?: boolean;
}

export interface ReportPDFOptions {
  header?: TournamentHeader;
  orientation?: 'portrait' | 'landscape';
  title?: string;
}

/** A report `width` is a Tabulator UI hint expressed in CSS pixels. The PDF
 * document is measured in millimetres, so a raw value like `110` was being read
 * as 110mm — two such columns (110 + 90) alone overflow A4's ~180mm usable
 * width and collapse every other column to 1–2 characters. Scale px → mm. */
const PX_TO_MM = 0.2645833;

/**
 * Translate our `ReportColumn[]` into jspdf-autotable `columnStyles`.
 * Pure and exported for testing.
 *  - `type: 'number'` → right-aligned.
 *  - `width` (px) → fixed `cellWidth` in mm.
 *  - `fitData` → `cellWidth: 'wrap'` (fit content, don't absorb slack).
 *  - neither → omitted, so autotable's default `'auto'` lets it absorb the
 *    remaining table width (keep exactly one such flexible column per report).
 */
export function buildReportColumnStyles(columns: ReportColumn[]): Record<string, any> {
  const columnStyles: Record<string, any> = {};
  for (const col of columns) {
    const style: Record<string, any> = {};
    if (col.type === 'number') style.halign = 'right';
    if (col.width) {
      style.cellWidth = Math.round(col.width * PX_TO_MM * 10) / 10;
    } else if (col.fitData) {
      style.cellWidth = 'wrap';
    }
    if (Object.keys(style).length) columnStyles[col.key] = style;
  }
  return columnStyles;
}

export function generateReportPDF(
  columns: ReportColumn[],
  rows: Record<string, any>[],
  options: ReportPDFOptions = {},
): jsPDF {
  // Report PDFs are wide, tabular exports — landscape is the sane default and
  // gives multi-column reports (e.g. Call Timing Variance) room to breathe.
  const orientation = options.orientation || 'landscape';
  const doc = new jsPDF({ orientation, format: 'a4' });
  applyDefaultFont(doc);
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

  const columnStyles = buildReportColumnStyles(columns);

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
