import jsPDF from 'jspdf';
import type { FooterConfig, PageConfig } from '../config/types';
import { setFont, SIZE, STYLE } from '../layout/fonts';

export function renderFooter(doc: jsPDF, config: FooterConfig, pageConfig: PageConfig, pageNumber?: number): number {
  switch (config.layout) {
    case 'standard':
      return renderStandardFooter(doc, config, pageConfig, pageNumber);
    case 'seedings':
      return renderSeedingsFooter(doc, config, pageConfig, pageNumber);
    case 'officials':
      return renderOfficialsFooter(doc, config, pageConfig, pageNumber);
    case 'none':
      return 0;
  }
}

export function measureFooterHeight(config: FooterConfig): number {
  switch (config.layout) {
    case 'standard':
      return 8 + (config.notes?.length || 0) * 3;
    case 'seedings':
      return 12;
    case 'officials':
      return 8 + (config.officials?.length || 0) * 3;
    case 'none':
      return 0;
  }
}

function renderStandardFooter(doc: jsPDF, config: FooterConfig, pageConfig: PageConfig, pageNumber?: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margins } = pageConfig;
  const rightEdge = pageWidth - margins.right;

  let y = pageHeight - margins.bottom;

  // Notes
  if (config.notes?.length) {
    setFont(doc, SIZE.TINY, STYLE.ITALIC);
    doc.setTextColor(100);
    for (const note of config.notes) {
      y -= 3;
      doc.text(note, margins.left, y);
    }
    doc.setTextColor(0);
  }

  // Separator line above footer
  y -= 2;
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(margins.left, y, rightEdge, y);
  y += 4;

  setFont(doc, SIZE.TINY, STYLE.NORMAL);
  doc.setTextColor(120);

  // Timestamp left
  if (config.showTimestamp) {
    doc.text(`Generated ${new Date().toLocaleDateString()}`, margins.left, y);
  }

  // Page number right
  if (config.showPageNumbers && pageNumber !== undefined) {
    doc.text(`Page ${pageNumber}`, rightEdge, y, { align: 'right' });
  }

  doc.setTextColor(0);
  return measureFooterHeight(config);
}

function renderSeedingsFooter(doc: jsPDF, config: FooterConfig, pageConfig: PageConfig, pageNumber?: number): number {
  // For now delegate to standard; seedings table is drawn by the generator in the content area
  return renderStandardFooter(doc, config, pageConfig, pageNumber);
}

function renderOfficialsFooter(doc: jsPDF, config: FooterConfig, pageConfig: PageConfig, pageNumber?: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margins } = pageConfig;

  let y = pageHeight - margins.bottom;

  if (config.officials?.length) {
    setFont(doc, SIZE.TINY, STYLE.NORMAL);
    doc.setTextColor(80);
    for (const official of config.officials) {
      y -= 3;
      doc.text(official, margins.left, y);
    }
    doc.setTextColor(0);
  }

  // Add standard footer elements below officials
  return renderStandardFooter(doc, config, pageConfig, pageNumber);
}
