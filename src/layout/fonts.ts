import jsPDF from 'jspdf';

export const FONT = {
  REGULAR: 'helvetica',
  BOLD: 'helvetica',
} as const;

export const STYLE = {
  NORMAL: 'normal' as const,
  BOLD: 'bold' as const,
  ITALIC: 'italic' as const,
};

export const SIZE = {
  TITLE: 16,
  SUBTITLE: 12,
  HEADING: 10,
  BODY: 8,
  SMALL: 7,
  TINY: 6,
};

export function setFont(doc: jsPDF, size: number, style: string = STYLE.NORMAL) {
  doc.setFont(FONT.REGULAR, style);
  doc.setFontSize(size);
}
