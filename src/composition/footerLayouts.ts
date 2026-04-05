import jsPDF from 'jspdf';
import type { FooterConfig, PageConfig } from '../config/types';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export function renderFooter(doc: jsPDF, config: FooterConfig, pageConfig: PageConfig, pageNumber?: number): number {
  switch (config.layout) {
    case 'standard':
      return renderStandardFooter(doc, config, pageConfig, pageNumber);
    case 'seedings':
    case 'seedings-table':
      return renderSeedingsTableFooter(doc, config, pageConfig, pageNumber);
    case 'prize-money':
      return renderPrizeMoneyFooter(doc, config, pageConfig, pageNumber);
    case 'officials':
    case 'officials-signoff':
      return renderOfficialsSignoffFooter(doc, config, pageConfig, pageNumber);
    case 'combined-tour':
      return renderCombinedTourFooter(doc, config, pageConfig, pageNumber);
    case 'none':
      return 0;
  }
}

export function measureFooterHeight(config: FooterConfig): number {
  switch (config.layout) {
    case 'standard':
      return 8 + (config.notes?.length || 0) * 3;
    case 'seedings':
    case 'seedings-table': {
      const seedRows = Math.ceil((config.seedAssignments?.length || 0) / 2);
      return 12 + seedRows * 3;
    }
    case 'prize-money':
      return 12 + (config.prizeMoney?.length || 0) * 2.5;
    case 'officials':
    case 'officials-signoff':
      return 12 + (config.signatureLines?.length || config.officials?.length || 0) * 5;
    case 'combined-tour': {
      const seedRows2 = Math.ceil((config.seedAssignments?.length || 0) / 2);
      const prizeRows = config.prizeMoney?.length || 0;
      const mainHeight = Math.max(seedRows2 * 3, prizeRows * 2.5);
      return 16 + mainHeight + (config.withdrawals?.length ? 6 : 0);
    }
    case 'none':
      return 0;
  }
}

// ---- Standard footer: timestamp + page number + notes ----

function renderStandardFooter(doc: jsPDF, config: FooterConfig, pageConfig: PageConfig, pageNumber?: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margins } = pageConfig;
  const rightEdge = pageWidth - margins.right;

  let y = pageHeight - margins.bottom;

  // Timestamp + page number at the very bottom
  setFont(doc, SIZE.TINY, STYLE.NORMAL);
  doc.setTextColor(120);
  if (config.showTimestamp) {
    doc.text(`Generated ${new Date().toLocaleDateString()}`, margins.left, y);
  }
  if (config.showPageNumbers && pageNumber !== undefined) {
    doc.text(`Page ${pageNumber}`, rightEdge, y, { align: 'right' });
  }
  doc.setTextColor(0);

  // Separator line above timestamp
  y -= 3;
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(margins.left, y, rightEdge, y);
  y -= 2;

  // Notes above separator
  if (config.notes?.length) {
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(100);
    for (let i = config.notes.length - 1; i >= 0; i--) {
      doc.text(config.notes[i], margins.left, y);
      y -= 3;
    }
    doc.setTextColor(0);
  }

  return measureFooterHeight(config);
}

// ---- Seedings table footer: two-column seed/player list ----

function renderSeedingsTableFooter(
  doc: jsPDF,
  config: FooterConfig,
  pageConfig: PageConfig,
  pageNumber?: number,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margins } = pageConfig;
  const rightEdge = pageWidth - margins.right;
  const footerH = measureFooterHeight(config);

  let y = pageHeight - margins.bottom - footerH + 4;

  // Separator
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(margins.left, y, rightEdge, y);
  y += 3;

  // Title
  setFont(doc, SIZE.SMALL, STYLE.BOLD);
  doc.text('Seeded Players', margins.left, y);
  y += 3;

  // Two-column layout
  const seeds = config.seedAssignments || [];
  const halfCol = (rightEdge - margins.left) / 2;
  setFont(doc, SIZE.TINY, STYLE.NORMAL);

  for (let i = 0; i < seeds.length; i++) {
    const col = i < Math.ceil(seeds.length / 2) ? 0 : 1;
    const row = col === 0 ? i : i - Math.ceil(seeds.length / 2);
    const x = margins.left + col * halfCol;
    const rowY = y + row * 3;
    const s = seeds[i];
    const rankStr = s.ranking ? ` (${s.ranking})` : '';
    doc.text(`${s.seedValue}. ${s.participantName}${rankStr}`, x, rowY);
  }

  const seedRows = Math.ceil(seeds.length / 2);
  y += seedRows * 3 + 2;

  // Standard footer elements below
  renderFooterBar(doc, config, pageConfig, pageNumber, y);

  return footerH;
}

// ---- Prize money footer: per-round amounts ----

function renderPrizeMoneyFooter(doc: jsPDF, config: FooterConfig, pageConfig: PageConfig, pageNumber?: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margins } = pageConfig;
  const rightEdge = pageWidth - margins.right;
  const footerH = measureFooterHeight(config);

  let y = pageHeight - margins.bottom - footerH + 4;

  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(margins.left, y, rightEdge, y);
  y += 3;

  setFont(doc, SIZE.SMALL, STYLE.BOLD);
  doc.text('Prize Money', margins.left, y);
  y += 3;

  const prizes = config.prizeMoney || [];
  setFont(doc, SIZE.TINY, STYLE.NORMAL);

  for (const p of prizes) {
    const parts = [p.round];
    if (p.amount) parts.push(p.amount);
    if (p.points) parts.push(`${p.points} pts`);
    doc.text(parts.join('  —  '), margins.left, y);
    y += 2.5;
  }

  y += 2;
  renderFooterBar(doc, config, pageConfig, pageNumber, y);

  return footerH;
}

// ---- Officials sign-off footer: signature lines + draw ceremony ----

function renderOfficialsSignoffFooter(
  doc: jsPDF,
  config: FooterConfig,
  pageConfig: PageConfig,
  pageNumber?: number,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margins } = pageConfig;
  const rightEdge = pageWidth - margins.right;
  const footerH = measureFooterHeight(config);

  let y = pageHeight - margins.bottom - footerH + 4;

  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(margins.left, y, rightEdge, y);
  y += 4;

  // Draw ceremony date
  if (config.drawCeremonyDate) {
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(80);
    doc.text(`Draw ceremony: ${config.drawCeremonyDate}`, margins.left, y);
    doc.setTextColor(0);
    y += 3;
  }

  // Release date
  if (config.releaseDate) {
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(80);
    doc.text(`Released: ${config.releaseDate}`, margins.left, y);
    doc.setTextColor(0);
    y += 3;
  }

  // Signature lines
  const lines: { role: string; name?: string }[] =
    config.signatureLines || (config.officials || []).map((name) => ({ role: name }));
  const lineWidth = (rightEdge - margins.left) / Math.min(lines.length, 3);

  for (let i = 0; i < lines.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margins.left + col * lineWidth;
    const lineY = y + row * 10;

    // Role label
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(100);
    doc.text(lines[i].role, x, lineY);
    doc.setTextColor(0);

    // Name (if provided)
    const lineName = lines[i].name;
    if (lineName) {
      setFont(doc, SIZE.TINY, STYLE.BOLD);
      doc.text(lineName, x, lineY + 3);
    }

    // Signature line
    doc.setDrawColor(150);
    doc.setLineWidth(0.15);
    doc.line(x, lineY + 5, x + lineWidth - 8, lineY + 5);
  }

  const rows = Math.ceil(lines.length / 3);
  y += rows * 10 + 2;

  renderFooterBar(doc, config, pageConfig, pageNumber, y);

  return footerH;
}

// ---- Combined tour footer: seedings + prize money + officials (WTA/ATP style) ----

function renderCombinedTourFooter(
  doc: jsPDF,
  config: FooterConfig,
  pageConfig: PageConfig,
  pageNumber?: number,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margins } = pageConfig;
  const rightEdge = pageWidth - margins.right;
  const footerH = measureFooterHeight(config);

  let y = pageHeight - margins.bottom - footerH + 4;

  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(margins.left, y, rightEdge, y);
  y += 3;

  const contentWidth = rightEdge - margins.left;
  const leftColX = margins.left;
  const rightColX = margins.left + contentWidth * 0.55;
  let leftY = y;
  let rightY = y;

  // Left column: seeded players
  const seeds = config.seedAssignments || [];
  if (seeds.length) {
    setFont(doc, SIZE.SMALL, STYLE.BOLD);
    doc.text('Seeded Players', leftColX, leftY);
    leftY += 3;

    setFont(doc, SIZE.TINY, STYLE.NORMAL);
    for (const s of seeds) {
      const rankStr = s.ranking ? ` (${s.ranking})` : '';
      doc.text(`${s.seedValue}. ${s.participantName}${rankStr}`, leftColX, leftY);
      leftY += 2.5;
    }
  }

  // Right column: prize money
  const prizes = config.prizeMoney || [];
  if (prizes.length) {
    setFont(doc, SIZE.SMALL, STYLE.BOLD);
    doc.text('Prize Money', rightColX, rightY);
    rightY += 3;

    setFont(doc, SIZE.TINY, STYLE.NORMAL);
    for (const p of prizes) {
      const parts = [p.round];
      if (p.amount) parts.push(p.amount);
      if (p.points) parts.push(`${p.points} pts`);
      doc.text(parts.join('  —  '), rightColX, rightY);
      rightY += 2.5;
    }
  }

  y = Math.max(leftY, rightY) + 2;

  // Withdrawals
  if (config.withdrawals?.length) {
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(80);
    const wdText = config.withdrawals.map((w) => (w.reason ? `${w.name} (${w.reason})` : w.name)).join(', ');
    doc.text(`Withdrawals: ${wdText}`, margins.left, y, { maxWidth: contentWidth });
    doc.setTextColor(0);
    y += 3;
  }

  // Lucky losers
  if (config.luckyLosers?.length) {
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(80);
    doc.text(`Lucky Losers: ${config.luckyLosers.join(', ')}`, margins.left, y, { maxWidth: contentWidth });
    doc.setTextColor(0);
    y += 3;
  }

  // Supervisor + release date
  if (config.officials?.length) {
    setFont(doc, SIZE.TINY, STYLE.NORMAL);
    doc.setTextColor(80);
    doc.text(config.officials.join(' | '), margins.left, y);
    doc.setTextColor(0);
    y += 3;
  }

  renderFooterBar(doc, config, pageConfig, pageNumber, y);

  return footerH;
}

// ---- Shared footer bar: timestamp + page number at the very bottom ----

function renderFooterBar(
  doc: jsPDF,
  config: FooterConfig,
  pageConfig: PageConfig,
  pageNumber?: number,
  _y?: number,
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margins } = pageConfig;
  const rightEdge = pageWidth - margins.right;
  const y = pageHeight - margins.bottom + 2;

  setFont(doc, SIZE.TINY, STYLE.NORMAL);
  doc.setTextColor(120);

  if (config.showTimestamp) {
    doc.text(`Generated ${new Date().toLocaleDateString()}`, margins.left, y);
  }
  if (config.releaseDate) {
    const relX = config.showTimestamp ? margins.left + 50 : margins.left;
    doc.text(`Released: ${config.releaseDate}`, relX, y);
  }
  if (config.showPageNumbers && pageNumber !== undefined) {
    doc.text(`Page ${pageNumber}`, rightEdge, y, { align: 'right' });
  }

  doc.setTextColor(0);
}
