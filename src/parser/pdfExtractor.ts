/**
 * PDF data extraction using pdf2json.
 *
 * Extracts text items with coordinates, horizontal/vertical lines, and fills.
 * This is the foundation for parsing existing tournament draw PDFs into structured data.
 */

import PDFParser from 'pdf2json';

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  row?: number;
  column?: number;
}

export interface PdfLine {
  x: number;
  y: number;
  length: number;
  width: number;
}

export interface PdfPage {
  pageNumber: number;
  width: number;
  height: number;
  texts: TextItem[];
  hLines: PdfLine[];
  vLines: PdfLine[];
}

export interface ParsedPdf {
  pages: PdfPage[];
  metadata: Record<string, any>;
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPdf> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on('pdfParser_dataError', (err: any) => reject(err));
    parser.on('pdfParser_dataReady', (pdfData: any) => {
      const pages = extractPages(pdfData);
      const metadata = pdfData.Meta || {};
      resolve({ pages, metadata });
    });
    parser.parseBuffer(buffer);
  });
}

function extractPages(pdfData: any): PdfPage[] {
  const rawPages = pdfData.Pages || pdfData.data?.Pages || [];

  return rawPages.map((page: any, index: number) => {
    const texts: TextItem[] = (page.Texts || []).map((t: any) => {
      const run = t.R?.[0];
      let text = '';
      if (run?.T) {
        try {
          text = decodeURIComponent(run.T);
        } catch {
          text = run.T;
        }
      }
      const ts = run?.TS || [0, 0, 0, 0];

      return {
        text,
        x: t.x || 0,
        y: t.y || 0,
        width: t.w || 0,
        fontSize: ts[1] || 0,
        isBold: ts[2] === 1,
        isItalic: ts[3] === 1,
      };
    });

    const hLines: PdfLine[] = (page.HLines || []).map((l: any) => ({
      x: l.x || 0,
      y: l.y || 0,
      length: l.l || 0,
      width: l.w || 0,
    }));

    const vLines: PdfLine[] = (page.VLines || []).map((l: any) => ({
      x: l.x || 0,
      y: l.y || 0,
      length: l.l || 0,
      width: l.w || 0,
    }));

    return {
      pageNumber: index + 1,
      width: page.Width || 0,
      height: page.Height || 0,
      texts,
      hLines,
      vLines,
    };
  });
}
