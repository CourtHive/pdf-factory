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

/**
 * A custom TrueType font to embed in a document so it can render glyphs the
 * built-in jsPDF fonts (WinAnsi / Latin-1 only) cannot — e.g. Central-European
 * (Latin-2) diacritics for Czech, Croatian, Polish, Hungarian, …
 *
 * `family` is the name `setFont` will select. Each variant is base64-encoded
 * TrueType data (no `data:` URI prefix). Only `normal` is required; omitted
 * styles fall back to the normal file so a document never silently reverts to
 * helvetica — which would drop diacritics on bold/italic runs.
 */
export interface FontDefinition {
  family: string;
  normal: string;
  bold?: string;
  italic?: string;
  bolditalic?: string;
}

// Per-document active embedded font family. Keyed by the jsPDF instance so
// concurrent documents never share font state.
const activeFonts = new WeakMap<jsPDF, string>();

const STYLE_KEYS = ['normal', 'bold', 'italic', 'bolditalic'] as const;

/**
 * Embed a custom font in `doc` and make it the active family for subsequent
 * `setFont` calls. Registers every style (missing ones reuse the normal file).
 * Returns the registered family name, or the built-in fallback when `font` is
 * incomplete.
 */
export function registerFont(doc: jsPDF, font: FontDefinition): string {
  if (!font?.family || !font?.normal) return FONT.REGULAR;

  for (const style of STYLE_KEYS) {
    const data = font[style] ?? font.normal;
    const fileName = `${font.family}-${style}.ttf`;
    doc.addFileToVFS(fileName, data);
    doc.addFont(fileName, font.family, style);
  }

  activeFonts.set(doc, font.family);
  return font.family;
}

/** The active embedded family for `doc`, or the built-in fallback if none. */
export function activeFontFamily(doc: jsPDF): string {
  return activeFonts.get(doc) ?? FONT.REGULAR;
}

export function setFont(doc: jsPDF, size: number, style: string = STYLE.NORMAL) {
  doc.setFont(activeFontFamily(doc), style);
  doc.setFontSize(size);
}
