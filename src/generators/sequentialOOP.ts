/**
 * Sequential Order of Play renderer (WTA/ATP/Grand Slam style).
 *
 * Portrait A4, courts stacked vertically with match boxes in sequence.
 * This is the format used by WTA, ATP, and Grand Slam tournaments.
 *
 * Layout per court:
 *   COURT NAME (centered, bold, uppercase)
 *   [Starting at X:XX PM] (colored bar)
 *   ┌─────────────────────┐
 *   │ [1] Player One NAT  │  Round label
 *   │        vs            │
 *   │ [3] Player Two NAT  │
 *   └─────────────────────┘
 *   [Not before X:XX PM] (colored bar)
 *   ┌─────────────────────┐
 *   │ Match 2...          │
 *   └─────────────────────┘
 */

import jsPDF from 'jspdf';
import type { ScheduleData, ScheduleMatch } from '../core/extractScheduleData';
import type { HeaderConfig, FooterConfig, PageConfig } from '../config/types';
import { renderHeader } from '../composition/headerLayouts';
import { renderFooter, measureFooterHeight } from '../composition/footerLayouts';
import { createDoc } from '../composition/page';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export interface SequentialOOPOptions {
  header?: HeaderConfig;
  footer?: FooterConfig;
  page?: Partial<PageConfig>;
  accentColor?: [number, number, number];
  disclaimer?: string;
  officials?: { role: string; name: string }[];
}

const DEFAULT_ACCENT: [number, number, number] = [120, 50, 140]; // WTA purple

export function generateSequentialOOP(scheduleData: ScheduleData, options: SequentialOOPOptions = {}): jsPDF {
  const pageConfig: PageConfig = {
    pageSize: options.page?.pageSize || 'a4',
    orientation: options.page?.orientation || 'portrait',
    margins: options.page?.margins || { top: 12, right: 15, bottom: 12, left: 15 },
  };

  const doc = createDoc(pageConfig);
  const { margins } = pageConfig;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margins.left - margins.right;
  const accent = options.accentColor || DEFAULT_ACCENT;
  const footerConfig: FooterConfig = options.footer || { layout: 'none' };
  const footerH = measureFooterHeight(footerConfig);

  let y = margins.top;

  // Header
  if (options.header) {
    y = margins.top + renderHeader(doc, options.header, pageConfig);
  }

  // Group matches by court, preserving time slot order
  const courtMatches = groupByCourt(scheduleData);

  for (const [courtName, matches] of courtMatches) {
    // Check if court section fits (at least court header + 1 match)
    if (y + 30 > pageHeight - margins.bottom - footerH) {
      renderPageFooter(doc, options, pageConfig, footerConfig);
      doc.addPage();
      y = margins.top;
    }

    // Court name header
    y = renderCourtHeader(doc, courtName, margins.left, y, contentWidth);

    let lastTime = '';
    for (const match of matches) {
      // Time bar if time changed
      const matchTime = match.scheduledTime || match.notBeforeTime || '';
      if (matchTime && matchTime !== lastTime) {
        if (y + 25 > pageHeight - margins.bottom - footerH) {
          renderPageFooter(doc, options, pageConfig, footerConfig);
          doc.addPage();
          y = margins.top;
        }
        const isNotBefore = !!match.notBeforeTime;
        y = renderTimeBar(doc, matchTime, isNotBefore, margins.left, y, contentWidth, accent);
        lastTime = matchTime;
      }

      // Match box
      if (y + 22 > pageHeight - margins.bottom - footerH) {
        renderPageFooter(doc, options, pageConfig, footerConfig);
        doc.addPage();
        y = margins.top;
      }
      y = renderMatchBox(doc, match, margins.left, y, contentWidth);
    }

    y += 4;
  }

  // Disclaimer
  if (options.disclaimer) {
    y += 2;
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(100);
    doc.text(options.disclaimer, pageWidth / 2, y, { align: 'center' });
    doc.setTextColor(0);
  }

  renderPageFooter(doc, options, pageConfig, footerConfig);

  return doc;
}

function renderCourtHeader(doc: jsPDF, courtName: string, x: number, y: number, width: number): number {
  setFont(doc, SIZE.HEADING, STYLE.BOLD);
  doc.setTextColor(40);
  doc.text(courtName.toUpperCase(), x + width / 2, y, { align: 'center' });
  doc.setTextColor(0);
  return y + 5;
}

function renderTimeBar(
  doc: jsPDF,
  time: string,
  isNotBefore: boolean,
  x: number,
  y: number,
  width: number,
  accent: [number, number, number],
): number {
  const label = isNotBefore ? `Not before ${time}` : `Starting at ${time}`;

  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(x + 20, y, width - 40, 5, 'F');

  setFont(doc, SIZE.SMALL, STYLE.ITALIC);
  doc.setTextColor(255, 255, 255);
  doc.text(label, x + width / 2, y + 3.5, { align: 'center' });
  doc.setTextColor(0);

  return y + 7;
}

function renderMatchBox(doc: jsPDF, match: ScheduleMatch, x: number, y: number, width: number): number {
  const boxX = x + 15;
  const boxWidth = width - 30;
  const startY = y;

  // Round label (top-right of box)
  setFont(doc, SIZE.TINY, STYLE.ITALIC);
  doc.setTextColor(100);
  const roundLabel = match.eventAbbr ? `${match.eventAbbr} ${match.roundName}` : match.roundName;
  doc.text(roundLabel, boxX + boxWidth - 2, y + 3, { align: 'right' });
  doc.setTextColor(0);

  // Score above players (if completed)
  if (match.score) {
    setFont(doc, SIZE.SMALL, STYLE.BOLD);
    doc.setTextColor(120, 50, 140);
    doc.text(match.score, boxX + boxWidth / 2, y + 3, { align: 'center' });
    doc.setTextColor(0);
    y += 4;
  }

  y += 2;

  // Player 1
  y = renderPlayer(doc, match.side1, boxX, y, boxWidth);

  // "vs" divider
  setFont(doc, SIZE.TINY, STYLE.ITALIC);
  doc.setTextColor(120);
  doc.text('vs', boxX + boxWidth / 2, y + 2.5, { align: 'center' });
  doc.setTextColor(0);
  y += 4;

  // Player 2
  y = renderPlayer(doc, match.side2, boxX, y, boxWidth);

  y += 2;

  // Box border
  const boxHeight = y - startY;
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.rect(boxX, startY, boxWidth, boxHeight);

  return y + 2;
}

function renderPlayer(
  doc: jsPDF,
  side: { name: string; nationality: string },
  x: number,
  y: number,
  _width: number,
): number {
  if (!side.name || side.name === 'TBD') {
    setFont(doc, SIZE.BODY, STYLE.ITALIC);
    doc.setTextColor(150);
    doc.text('TBD', x + 10, y + 3);
    doc.setTextColor(0);
    return y + 4;
  }

  setFont(doc, SIZE.BODY, STYLE.NORMAL);

  // Format: player name centered with nationality
  const nameWithNat = side.nationality ? `${side.name}  ${side.nationality}` : side.name;
  doc.text(nameWithNat, x + 10, y + 3);

  return y + 4;
}

function groupByCourt(scheduleData: ScheduleData): Map<string, ScheduleMatch[]> {
  const courtMap = new Map<string, ScheduleMatch[]>();

  // Preserve court order from scheduleData.courts
  for (const court of scheduleData.courts) {
    courtMap.set(court, []);
  }

  // Fill matches in time slot order
  for (const slot of scheduleData.timeSlots) {
    for (const match of slot.matches) {
      if (!courtMap.has(match.courtName)) courtMap.set(match.courtName, []);
      courtMap.get(match.courtName)!.push(match);
    }
  }

  // Remove empty courts
  for (const [court, matches] of courtMap) {
    if (matches.length === 0) courtMap.delete(court);
  }

  return courtMap;
}

function renderPageFooter(
  doc: jsPDF,
  options: SequentialOOPOptions,
  pageConfig: PageConfig,
  footerConfig: FooterConfig,
): void {
  const { margins } = pageConfig;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (options.officials?.length) {
    const y = pageHeight - margins.bottom - 10;
    doc.setDrawColor(120);
    doc.setLineWidth(0.2);
    doc.line(margins.left, y - 2, pageWidth - margins.right, y - 2);

    const spacing = (pageWidth - margins.left - margins.right) / options.officials.length;

    options.officials.forEach((official, i) => {
      const ox = margins.left + i * spacing;
      setFont(doc, SIZE.TINY, STYLE.BOLD);
      doc.text(official.role, ox, y);
      setFont(doc, SIZE.TINY, STYLE.NORMAL);
      doc.text(official.name, ox, y + 3);
    });
  }

  renderFooter(doc, footerConfig, pageConfig);
}
