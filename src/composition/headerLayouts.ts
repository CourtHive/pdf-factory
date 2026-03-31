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
    case 'wta-tour':
      return renderWtaTourHeader(doc, config, pageConfig);
    case 'national-federation':
      return renderNationalFederationHeader(doc, config, pageConfig);
    case 'none':
      return 0;
  }
}

function renderGrandSlamHeader(doc: jsPDF, config: HeaderConfig, pageConfig: PageConfig): number {
  const { margins } = pageConfig;
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightEdge = pageWidth - margins.right;
  let y = margins.top;

  setFont(doc, 18, STYLE.BOLD);
  doc.text(config.tournamentName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 7;

  if (config.subtitle) {
    setFont(doc, 12, STYLE.BOLD);
    doc.text(config.subtitle.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 6;
  }

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

  setFont(doc, SIZE.TITLE, STYLE.BOLD);
  doc.text(config.tournamentName, margins.left, y);
  y += 6;

  if (config.subtitle) {
    setFont(doc, SIZE.SUBTITLE, STYLE.BOLD);
    doc.text(config.subtitle, margins.left, y);
    y += 5;
  }

  setFont(doc, SIZE.SMALL, STYLE.NORMAL);
  const rightLines: string[] = [];
  if (config.grade) rightLines.push(`Grade: ${config.grade}`);
  if (config.surface) rightLines.push(`Surface: ${config.surface}`);
  if (config.supervisor) rightLines.push(`Supervisor: ${config.supervisor}`);
  rightLines.forEach((line, i) => {
    doc.text(line, rightEdge, margins.top + i * 3.5, { align: 'right' });
  });

  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  const infoLine: string[] = [];
  if (config.startDate) infoLine.push(config.startDate);
  if (config.location) infoLine.push(config.location);
  if (config.organizer) infoLine.push(config.organizer);
  if (infoLine.length) {
    doc.text(infoLine.join(' | '), margins.left, y);
    y += 4;
  }

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
  const nameWidth = doc.getTextWidth(config.tournamentName);

  if (config.subtitle) {
    setFont(doc, SIZE.BODY, STYLE.NORMAL);
    doc.text(` - ${config.subtitle}`, margins.left + nameWidth, y);
  }

  y += 6;
  return y - margins.top;
}

/**
 * WTA/ATP Tour header — flanking logos, centered tournament info, section label.
 *
 * Layout:
 *   [Left Logo]   TOURNAMENT NAME          [Right Logo]
 *                  City, Country
 *          Dates | Prize Money | Surface
 *                                    SINGLES MAIN DRAW
 *   ─────────────────────────────────────────────────────
 */
function renderWtaTourHeader(doc: jsPDF, config: HeaderConfig, pageConfig: PageConfig): number {
  const { margins } = pageConfig;
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightEdge = pageWidth - margins.right;
  const centerX = pageWidth / 2;
  let y = margins.top;

  // Logos (if provided as base64)
  const logoSize = 12;
  if (config.leftLogoBase64) {
    try {
      doc.addImage(config.leftLogoBase64, 'PNG', margins.left, y - 2, logoSize, logoSize);
    } catch {
      /* logo failed to load */
    }
  }
  if (config.rightLogoBase64) {
    try {
      doc.addImage(config.rightLogoBase64, 'PNG', rightEdge - logoSize, y - 2, logoSize, logoSize);
    } catch {
      /* logo failed to load */
    }
  }

  // Tournament name — centered, large
  setFont(doc, 14, STYLE.BOLD);
  doc.text(config.tournamentName, centerX, y, { align: 'center' });
  y += 5;

  // City, Country
  const cityCountry = [config.city, config.country].filter(Boolean).join(', ');
  if (cityCountry) {
    setFont(doc, SIZE.BODY, STYLE.NORMAL);
    doc.setTextColor(80);
    doc.text(cityCountry.toUpperCase(), centerX, y, { align: 'center' });
    doc.setTextColor(0);
    y += 4;
  }

  // Dates | Prize Money | Surface
  const detailParts: string[] = [];
  if (config.startDate) {
    const dateStr = config.endDate ? `${config.startDate} - ${config.endDate}` : config.startDate;
    detailParts.push(dateStr);
  }
  if (config.prizeMoney) {
    const money = config.currency ? `${config.currency} ${config.prizeMoney}` : config.prizeMoney;
    detailParts.push(money);
  }
  if (config.surface) detailParts.push(config.surface);
  if (detailParts.length) {
    setFont(doc, SIZE.SMALL, STYLE.NORMAL);
    doc.text(detailParts.join(' | '), centerX, y, { align: 'center' });
    y += 4;
  }

  // Section label — right-aligned (e.g., "SINGLES MAIN DRAW", "TOP HALF")
  if (config.sectionLabel) {
    setFont(doc, SIZE.SMALL, STYLE.BOLD);
    doc.text(config.sectionLabel.toUpperCase(), rightEdge, y, { align: 'right' });
    y += 3;
  }

  // Separator
  y += 1;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margins.left, y, rightEdge, y);
  y += 3;

  return y - margins.top;
}

/**
 * National Federation header — detailed metadata row.
 *
 * Layout:
 *   TOURNAMENT NAME                           [Federation Logo]
 *   Subtitle (event name)
 *   Date | Organizer | City | Tournament ID | Grade | Chief Umpire
 *   ─────────────────────────────────────────────────────────────
 */
function renderNationalFederationHeader(doc: jsPDF, config: HeaderConfig, pageConfig: PageConfig): number {
  const { margins } = pageConfig;
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightEdge = pageWidth - margins.right;
  let y = margins.top;

  // Logo right-aligned
  if (config.rightLogoBase64) {
    try {
      doc.addImage(config.rightLogoBase64, 'PNG', rightEdge - 14, y - 2, 14, 14);
    } catch {
      /* logo failed */
    }
  }

  // Tournament name — left, large
  setFont(doc, SIZE.TITLE, STYLE.BOLD);
  doc.text(config.tournamentName, margins.left, y);
  y += 6;

  // Subtitle
  if (config.subtitle) {
    setFont(doc, SIZE.HEADING, STYLE.BOLD);
    doc.text(config.subtitle, margins.left, y);
    y += 4;
  }

  // Metadata row
  setFont(doc, SIZE.TINY, STYLE.NORMAL);
  doc.setTextColor(80);
  const metaParts: string[] = [];
  if (config.startDate) metaParts.push(config.startDate);
  if (config.organizer) metaParts.push(config.organizer);
  if (config.city || config.country) metaParts.push([config.city, config.country].filter(Boolean).join(', '));
  if (config.tournamentId) metaParts.push(`ID: ${config.tournamentId}`);
  if (config.grade) metaParts.push(`Grade: ${config.grade}`);
  if (config.chiefUmpire) metaParts.push(`Umpire: ${config.chiefUmpire}`);
  if (metaParts.length) {
    doc.text(metaParts.join(' | '), margins.left, y);
    y += 3;
  }
  doc.setTextColor(0);

  // Separator
  y += 1;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margins.left, y, rightEdge, y);
  y += 3;

  return y - margins.top;
}
