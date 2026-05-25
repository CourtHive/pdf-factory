import { describe, it, expect } from 'vitest';
import jsPDF from 'jspdf';

import { createDoc, getDefaultPageConfig } from '../composition/page';
import { setFont, registerFont, activeFontFamily, FONT } from '../layout/fonts';

// jsPDF's addFileToVFS just stores the string and addFont registers metadata;
// no valid TTF is needed to verify registration/selection (we never render text).
const DUMMY = 'AAEAAAALAIAAAwAw';

const FAMILY = 'DejaVuSans';

/** Find a getFontList() key case-insensitively (jsPDF may normalize case). */
function fontStyles(doc: jsPDF, family: string): string[] | undefined {
  const list = doc.getFontList();
  const key = Object.keys(list).find((k) => k.toLowerCase() === family.toLowerCase());
  return key ? (list[key] as string[]) : undefined;
}

describe('registerFont', () => {
  it('registers every style and returns the family name', () => {
    const doc = new jsPDF();
    const returned = registerFont(doc, { family: FAMILY, normal: DUMMY, bold: DUMMY });
    expect(returned).toBe(FAMILY);

    const styles = fontStyles(doc, FAMILY);
    expect(styles).toBeDefined();
    expect(styles).toEqual(expect.arrayContaining(['normal', 'bold', 'italic', 'bolditalic']));
  });

  it('makes the registered font the active family', () => {
    const doc = new jsPDF();
    registerFont(doc, { family: FAMILY, normal: DUMMY });
    expect(activeFontFamily(doc)).toBe(FAMILY);
  });

  it('still registers bold/italic when only normal is supplied (no helvetica fallback mid-doc)', () => {
    const doc = new jsPDF();
    registerFont(doc, { family: FAMILY, normal: DUMMY });
    // bold must be registered for the custom family so bold runs keep its glyphs
    const styles = fontStyles(doc, FAMILY);
    expect(styles).toEqual(expect.arrayContaining(['normal', 'bold']));
  });

  it('ignores an incomplete definition and keeps the built-in fallback', () => {
    const doc = new jsPDF();
    const returned = registerFont(doc, { family: FAMILY, normal: '' });
    expect(returned).toBe(FONT.REGULAR);
    expect(activeFontFamily(doc)).toBe(FONT.REGULAR);
  });

  it('isolates active font per document', () => {
    const docA = new jsPDF();
    const docB = new jsPDF();
    registerFont(docA, { family: FAMILY, normal: DUMMY });
    expect(activeFontFamily(docA)).toBe(FAMILY);
    expect(activeFontFamily(docB)).toBe(FONT.REGULAR);
  });
});

describe('setFont', () => {
  it('uses the built-in helvetica when no font is registered', () => {
    const doc = new jsPDF();
    setFont(doc, 10, 'normal');
    expect(doc.getFont().fontName.toLowerCase()).toBe('helvetica');
  });

  it('uses the registered family and honors the requested style', () => {
    const doc = new jsPDF();
    registerFont(doc, { family: FAMILY, normal: DUMMY, bold: DUMMY });
    setFont(doc, 10, 'bold');
    const active = doc.getFont();
    expect(active.fontName.toLowerCase()).toBe(FAMILY.toLowerCase());
    expect(active.fontStyle).toBe('bold');
  });
});

describe('createDoc font threading', () => {
  it('embeds a font passed via PageConfig.font', () => {
    const doc = createDoc({ ...getDefaultPageConfig(), font: { family: FAMILY, normal: DUMMY } }, 16);
    expect(activeFontFamily(doc)).toBe(FAMILY);
    expect(fontStyles(doc, FAMILY)).toBeDefined();
  });

  it('leaves the built-in font when no font is configured', () => {
    const doc = createDoc(getDefaultPageConfig(), 16);
    expect(activeFontFamily(doc)).toBe(FONT.REGULAR);
  });
});
