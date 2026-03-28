import jsPDF from 'jspdf';
import type { HeaderConfig, PageConfig } from '../config/types';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export function renderHeader(doc: jsPDF, config: HeaderConfig, pageConfig: PageConfig): number {
  switch (config.layout) {
    case 'grand-slam':
      return renderGrandSlamHeader(doc, config, pageConfig);
    case 'itf':
      return renderItfHeader(doc, config, pageConfig);
    case 'minimal':
      return renderMinimalHeader(doc, config, pageConfig);
    case 'none':
      return 0;
  }
}

function renderGrandSlamHeader(doc: jsPDF, config: HeaderConfig, pageConfig: PageConfig): number {
  const { margins } = pageConfig;
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightEdge = pageWidth - margins.right;
  let y = margins.top;

  // Tournament name — large, centered
  setFont(doc, 18, STYLE.BOLD);
  doc.text(config.tournamentName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 7;

  // Subtitle (event name)
  if (config.subtitle) {
    setFont(doc, 12, STYLE.BOLD);
    doc.text(config.subtitle.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 6;
  }

  // Date + location right-aligned
  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  const metaLines: string[] = [];
  if (config.startDate) {
    const dateStr = config.endDate ? `${config.startDate} - ${config.endDate}` : config.startDate;
    metaLines.push(dateStr);
  }
  if (config.location) metaLines.push(config.location);

  metaLines.forEach((line, i) => {
    doc.text(line, rightEdge, margins.top + i * 4, { align: 'right' });
  });

  // Separator line
  y += 2;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margins.left, y, rightEdge, y);
  y += 3;

  return y - margins.top;
}

function renderItfHeader(doc: jsPDF, config: HeaderConfig, pageConfig: PageConfig): number {
  const { margins } = pageConfig;
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightEdge = pageWidth - margins.right;
  let y = margins.top;

  // Tournament name — left
  setFont(doc, SIZE.TITLE, STYLE.BOLD);
  doc.text(config.tournamentName, margins.left, y);
  y += 6;

  // Subtitle
  if (config.subtitle) {
    setFont(doc, SIZE.SUBTITLE, STYLE.BOLD);
    doc.text(config.subtitle, margins.left, y);
    y += 5;
  }

  // Right side: grade, surface, supervisor
  setFont(doc, SIZE.SMALL, STYLE.NORMAL);
  const rightLines: string[] = [];
  if (config.grade) rightLines.push(`Grade: ${config.grade}`);
  if (config.surface) rightLines.push(`Surface: ${config.surface}`);
  if (config.supervisor) rightLines.push(`Supervisor: ${config.supervisor}`);

  rightLines.forEach((line, i) => {
    doc.text(line, rightEdge, margins.top + i * 3.5, { align: 'right' });
  });

  // Date + location below name
  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  const infoLine: string[] = [];
  if (config.startDate) infoLine.push(config.startDate);
  if (config.location) infoLine.push(config.location);
  if (config.organizer) infoLine.push(config.organizer);
  if (infoLine.length) {
    doc.text(infoLine.join(' | '), margins.left, y);
    y += 4;
  }

  // Separator
  y += 1;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margins.left, y, rightEdge, y);
  y += 3;

  return y - margins.top;
}

function renderMinimalHeader(doc: jsPDF, config: HeaderConfig, pageConfig: PageConfig): number {
  const { margins } = pageConfig;
  let y = margins.top;

  setFont(doc, SIZE.SUBTITLE, STYLE.BOLD);
  doc.text(config.tournamentName, margins.left, y);

  if (config.subtitle) {
    setFont(doc, SIZE.BODY, STYLE.NORMAL);
    doc.text(` - ${config.subtitle}`, margins.left + doc.getTextWidth(config.tournamentName), y);
  }

  y += 6;
  return y - margins.top;
}
