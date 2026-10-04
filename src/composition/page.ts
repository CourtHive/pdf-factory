import jsPDF from 'jspdf';
import { registerFont, applyDefaultFont } from '../layout/fonts';
import type { PageConfig, PageRegions } from '../config/types';

const PAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 216, height: 279 },
};

export function createDoc(config: PageConfig, drawSize?: number): jsPDF {
  let orientation = config.orientation;
  if (orientation === 'auto') {
    orientation = drawSize && drawSize >= 32 ? 'landscape' : 'portrait';
  }
  const doc = new jsPDF({ orientation, format: config.pageSize, unit: 'mm' });
  if (config.font) registerFont(doc, config.font);
  else applyDefaultFont(doc);
  return doc;
}

export function getPageRegions(
  doc: jsPDF,
  config: PageConfig,
  headerHeight: number,
  footerHeight: number,
): PageRegions {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margins } = config;

  const contentY = margins.top + headerHeight;
  const contentHeight = pageHeight - margins.top - margins.bottom - headerHeight - footerHeight;
  const contentWidth = pageWidth - margins.left - margins.right;

  return {
    headerHeight,
    footerHeight,
    contentY,
    contentHeight,
    contentWidth,
    pageWidth,
    pageHeight,
  };
}

export function getDefaultPageConfig(): PageConfig {
  return {
    pageSize: 'a4',
    orientation: 'auto',
    margins: { top: 15, right: 10, bottom: 15, left: 10 },
  };
}

export { PAGE_DIMENSIONS };
