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

export function mergeTextItems(items: TextItem[], yTolerance: number = 0.3, xGap: number = 0.8): MergedTextItem[] {
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
    // Sort by x position
    const sorted = [...rowItems].sort((a, b) => a.x - b.x);

    let current: MergedTextItem | null = null;

    for (const item of sorted) {
      if (!current) {
        current = startMerged(item, row);
        continue;
      }

      // Check if this item should merge with current
      const currentEnd = current.x + current.width;
      const gap = item.x - currentEnd;
      const sameBold = item.isBold === current.isBold;

      // Merge if close together and same style (or within a very tight gap)
      if (gap < xGap && (sameBold || gap < 0.2)) {
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

  // Strip leading entry code: "QNAME" (single letter before uppercase name)
  if (seedValue === undefined && /^[QWLA][A-Z]{2}/.test(cleanText)) {
    entryCode = cleanText[0];
    cleanText = cleanText.slice(1);
  }

  return { cleanText, seedValue, entryCode };
}
