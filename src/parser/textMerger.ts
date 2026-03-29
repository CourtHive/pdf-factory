/**
 * Merge fragmented text items that belong together.
 *
 * Many PDF generators (especially Chromium/Skia) split text into
 * individual character or word runs at slightly different x-positions.
 * This module merges adjacent items on the same row into coherent text.
 */

import type { TextItem } from './pdfExtractor';
import { clusterCoordinates, findClusterIndex } from './coordinateClustering';

export interface MergedTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  row: number;
  fragments: TextItem[];
}

export function mergeTextItems(items: TextItem[], yTolerance: number = 0.3, xGap: number = 2.5): MergedTextItem[] {
  if (!items.length) return [];

  // Cluster by y-coordinate to identify rows
  const yCoords = items.map((t) => t.y);
  const rowClusters = clusterCoordinates(yCoords, yTolerance);

  // Group items by row
  const rowGroups = new Map<number, TextItem[]>();
  for (const item of items) {
    const row = findClusterIndex(rowClusters, item.y);
    if (!rowGroups.has(row)) rowGroups.set(row, []);
    rowGroups.get(row)!.push(item);
  }

  const merged: MergedTextItem[] = [];

  for (const [row, rowItems] of rowGroups) {
    const sorted = [...rowItems].sort((a, b) => a.x - b.x);

    let current: MergedTextItem | null = null;

    for (const item of sorted) {
      if (!current) {
        current = startMerged(item, row);
        continue;
      }

      // Estimate where current text ends based on character count
      // pdf2json units are ~1/4.5 per character at typical font sizes
      const estimatedCharWidth = 0.22;
      const estimatedEnd = current.x + current.text.length * estimatedCharWidth;
      const gapFromEnd = item.x - estimatedEnd;
      const gapFromStart = item.x - current.x;

      // Also check raw gap from last fragment's x position
      const lastFragment = current.fragments[current.fragments.length - 1];
      const lastFragEnd = lastFragment.x + lastFragment.text.length * estimatedCharWidth;
      const gapFromLastFrag = item.x - lastFragEnd;

      // Merge if the gap is small (text continuation) and not a column jump
      const isClose = gapFromLastFrag < xGap && gapFromEnd < xGap;
      const isBoldChange = item.isBold !== current.isBold;
      const isColumnJump = gapFromStart > 6; // Country codes are always far right

      if (isClose && !isColumnJump && (!isBoldChange || gapFromLastFrag < 0.5)) {
        current.text += item.text;
        current.width = item.x + (item.width || 0) - current.x;
        current.fragments.push(item);
      } else {
        merged.push(current);
        current = startMerged(item, row);
      }
    }

    if (current) merged.push(current);
  }

  return merged;
}

function startMerged(item: TextItem, row: number): MergedTextItem {
  return {
    text: item.text,
    x: item.x,
    y: item.y,
    width: item.width || 0,
    fontSize: item.fontSize,
    isBold: item.isBold,
    isItalic: item.isItalic,
    row,
    fragments: [item],
  };
}

/**
 * Post-process merged text to fix common WTA/Chromium artifacts:
 * - Seed number glued to name: "1SABALENKA" -> seed=1, name="SABALENKA"
 * - Split names: "KUDERMET" + "OVA" -> "KUDERMETOVA"
 * - Entry code glued: "QABC" -> entry="Q", name="ABC"
 */
export function cleanMergedText(text: string): {
  cleanText: string;
  seedValue?: number;
  entryCode?: string;
} {
  let cleanText = text.trim();
  let seedValue: number | undefined;
  let entryCode: string | undefined;

  // Strip leading seed number: "1SABALENKA" or "16MUCHOVA"
  if (/^\d{1,2}[A-Z]/.test(cleanText)) {
    const numEnd = cleanText.search(/[A-Z]/);
    seedValue = parseInt(cleanText.slice(0, numEnd));
    cleanText = cleanText.slice(numEnd);
  }

  // Strip leading entry code: "QNAME", "WCNAME", "LLNAME"
  // This can happen after seed stripping: "4QKUDERMETOVA" -> seed=4, "QKUDERMETOVA"
  if (/^(?:WC|LL|SE|PR)[A-Z]{2}/.test(cleanText)) {
    entryCode = cleanText.slice(0, 2);
    cleanText = cleanText.slice(2);
  }

  // Strip trailing glued country code: "RebeccaSVK" -> "Rebecca" (3 uppercase at end after lowercase)
  const trailingMatch = cleanText.match(/^(.+[a-z])([A-Z]{3})$/);
  if (trailingMatch && trailingMatch[1].length > 3) {
    cleanText = trailingMatch[1];
  }

  return { cleanText, seedValue, entryCode };
}
