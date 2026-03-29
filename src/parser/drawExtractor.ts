/**
 * Extract structured draw data from a parsed PDF.
 *
 * Takes text items with coordinates and produces TODS-compatible
 * participant and draw position data. This is the core of the
 * PDF-to-TODS pipeline for historical data recovery.
 *
 * Inspired by pdfRuler's anchor-based extraction pattern:
 * 1. Find anchor text items (round headers, known labels)
 * 2. Define extraction boundaries based on anchors
 * 3. Cluster text into rows/columns within boundaries
 * 4. Classify each text item (player name, score, seed, country)
 * 5. Assemble into structured draw data
 */

import type { PdfPage, TextItem } from './pdfExtractor';
import { clusterCoordinates, findClusterIndex } from './coordinateClustering';
import { detectRegions } from './regionDetector';
import { classifyText, extractPlayerName, extractSeedValue, type ClassifiedText } from './textAnalyzer';
import { mergeTextItems, cleanMergedText } from './textMerger';

export interface ExtractedParticipant {
  familyName: string;
  givenName: string;
  nationalityCode?: string;
  seedValue?: number;
  drawPosition?: number;
  entryStatus?: string;
}

export interface ExtractedMatchUp {
  roundNumber: number;
  roundPosition: number;
  score?: string;
  side1DrawPosition?: number;
  side2DrawPosition?: number;
}

export interface ExtractedDrawData {
  tournamentName?: string;
  eventName?: string;
  participants: ExtractedParticipant[];
  matchUps: ExtractedMatchUp[];
  roundLabels: string[];
  metadata: Record<string, string>;
}

export function extractDrawFromPage(page: PdfPage, tolerance: number = 0.3): ExtractedDrawData {
  const regions = detectRegions(page, tolerance);

  // Extract tournament info from header
  const metadata = extractMetadata(regions.header.items);

  // Classify all content area text
  const classified = regions.content.items.map((item) => classifyText(item.text, item.x, item.y));

  // Cluster content text into rows and columns
  const contentTexts = regions.content.items;
  const yCoords = contentTexts.map((t) => t.y);
  const xCoords = contentTexts.map((t) => t.x);
  const rowClusters = clusterCoordinates(yCoords, tolerance);
  const colClusters = clusterCoordinates(xCoords, tolerance);

  // Assign row/column indices
  const enriched = contentTexts.map((item, i) => ({
    ...item,
    row: findClusterIndex(rowClusters, item.y),
    column: findClusterIndex(colClusters, item.x),
    classification: classified[i],
  }));

  // Find round label columns (they're typically in the top content row)
  const roundLabels = extractRoundLabels(enriched);

  // Extract first-round participants from the leftmost columns
  const participants = extractParticipants(enriched, colClusters);

  // Extract scores (they appear between round columns)
  const matchUps = extractMatchUps(enriched, roundLabels);

  return {
    tournamentName: metadata.tournamentName,
    eventName: metadata.eventName,
    participants,
    matchUps,
    roundLabels: roundLabels.map((r) => r.text),
    metadata: metadata.raw,
  };
}

interface EnrichedText extends TextItem {
  row: number;
  column: number;
  classification: ClassifiedText;
}

function extractMetadata(headerItems: TextItem[]): {
  tournamentName?: string;
  eventName?: string;
  raw: Record<string, string>;
} {
  const raw: Record<string, string> = {};
  let tournamentName: string | undefined;
  let eventName: string | undefined;

  // The largest/boldest text in the header is likely the tournament name
  const sorted = [...headerItems].sort((a, b) => b.fontSize - a.fontSize);
  if (sorted.length > 0) {
    tournamentName = sorted[0].text;
    raw.tournamentName = tournamentName;
  }
  if (sorted.length > 1) {
    eventName = sorted[1].text;
    raw.eventName = eventName;
  }

  // Collect all header text
  headerItems.forEach((item, i) => {
    raw[`header_${i}`] = item.text;
  });

  return { tournamentName, eventName, raw };
}

function extractRoundLabels(items: EnrichedText[]): EnrichedText[] {
  return items.filter((item) => item.classification.type === 'round-label');
}

function extractParticipants(
  items: EnrichedText[],
  _colClusters: ReturnType<typeof clusterCoordinates>,
): ExtractedParticipant[] {
  const participants: ExtractedParticipant[] = [];

  // Group items by row
  const rowMap = new Map<number, EnrichedText[]>();
  for (const item of items) {
    if (!rowMap.has(item.row)) rowMap.set(item.row, []);
    rowMap.get(item.row)!.push(item);
  }

  // For each row, look for player name + country code + seed patterns
  for (const [, rowItems] of rowMap) {
    const sorted = rowItems.sort((a, b) => a.x - b.x);

    let drawPosition: number | undefined;
    let familyName = '';
    let givenName = '';
    let nationalityCode: string | undefined;
    let seedValue: number | undefined;
    let entryStatus: string | undefined;
    let hasPlayerName = false;

    for (const item of sorted) {
      // Try to parse AO-style combined entries: "2. STEPHENS, Sloane (USA)" or "8. NOSKOVA, Linda (CZE) [29]"
      if (item.classification.type === 'unknown' && !hasPlayerName) {
        const aoResult = parseAoCombinedEntry(item.text);
        if (aoResult) {
          if (aoResult.drawPosition) drawPosition = aoResult.drawPosition;
          familyName = aoResult.familyName;
          givenName = aoResult.givenName;
          nationalityCode = aoResult.nationalityCode;
          seedValue = aoResult.seedValue;
          entryStatus = aoResult.entryStatus;
          hasPlayerName = true;
          continue;
        }
      }

      switch (item.classification.type) {
        case 'draw-position':
          drawPosition = parseInt(item.text);
          break;
        case 'player-name': {
          if (!hasPlayerName && item.classification.confidence >= 0.7) {
            const parsed = extractPlayerName(item.text);
            if (parsed && parsed.givenName.length > 2) {
              familyName = parsed.familyName;
              givenName = parsed.givenName;
              hasPlayerName = true;
              // Also extract seed from text like "SABALENKA, Aryna [1]"
              const inlineSeed = extractSeedValue(item.text);
              if (inlineSeed) seedValue = inlineSeed;
            }
          }
          break;
        }
        case 'country-code':
          nationalityCode = item.text;
          break;
        case 'seed':
          seedValue = extractSeedValue(item.text) ?? undefined;
          break;
        case 'entry-code':
          entryStatus = item.text.replace(/[()]/g, '');
          break;
      }
    }

    if (hasPlayerName) {
      participants.push({ familyName, givenName, nationalityCode, seedValue, drawPosition, entryStatus });
    }
  }

  return participants.sort((a, b) => (a.drawPosition || 999) - (b.drawPosition || 999));
}

/**
 * Parse AO-style combined entry: "2. STEPHENS, Sloane (USA)" or "10. KUDERMETOVA, Polina -Q"
 * or "8. NOSKOVA, Linda (CZE) [29]"
 */
function parseAoCombinedEntry(text: string): ExtractedParticipant | null {
  // Strip leading draw position: "2. " or "10. "
  const dotIdx = text.indexOf('. ');
  if (dotIdx < 0 || dotIdx > 3) return null;
  const posMatch = [text, text.slice(0, dotIdx), text.slice(dotIdx + 2)];
  const drawPosition = parseInt(posMatch[1]);
  if (isNaN(drawPosition) || drawPosition > 256) return null;
  let remainder = posMatch[2];

  // Extract trailing entry code: "-Q", "-WC", "-LL"
  let entryStatus: string | undefined;
  const entryTokens = ['-ALT', '-WC', '-LL', '-SE', '-Q', '-A'];
  for (const token of entryTokens) {
    if (remainder.endsWith(token)) {
      entryStatus = token.slice(1);
      remainder = remainder.slice(0, -token.length).trim();
      break;
    }
  }

  // Extract trailing seed: "[29]" or "[1]"
  let seedValue: number | undefined;
  if (remainder.endsWith(']')) {
    const bracketIdx = remainder.lastIndexOf('[');
    if (bracketIdx > 0) {
      const seedStr = remainder.slice(bracketIdx + 1, -1);
      const parsed = parseInt(seedStr);
      if (!isNaN(parsed)) {
        seedValue = parsed;
        remainder = remainder.slice(0, bracketIdx).trim();
      }
    }
  }

  // Extract nationality in parens: "(USA)" or "(CZE)"
  let nationalityCode: string | undefined;
  if (remainder.endsWith(')')) {
    const parenIdx = remainder.lastIndexOf('(');
    if (parenIdx > 0 && remainder.length - parenIdx === 4) {
      nationalityCode = remainder.slice(parenIdx + 1, -1);
      remainder = remainder.slice(0, parenIdx).trim();
    }
  }

  // What's left should be the player name: "LASTNAME, Firstname"
  const commaIdx = remainder.indexOf(',');
  if (commaIdx < 1) return null;
  const familyName = remainder.slice(0, commaIdx);
  const givenName = remainder.slice(commaIdx + 1).trim();
  if (!/^[A-Z]{2}/.test(familyName) || !givenName) return null;

  return {
    familyName,
    givenName,
    drawPosition,
    nationalityCode,
    seedValue,
    entryStatus,
  };
}

function extractMatchUps(items: EnrichedText[], _roundLabels: EnrichedText[]): ExtractedMatchUp[] {
  // Find all score items — they represent completed matchUps
  const scores = items.filter((item) => item.classification.type === 'score');

  return scores.map((scoreItem, i) => ({
    roundNumber: 0, // Would need round-column mapping to determine
    roundPosition: i + 1,
    score: scoreItem.text,
  }));
}

/**
 * Enhanced extraction that merges fragmented text items first.
 * Use this for Chromium-generated PDFs (WTA, ATP via protennislive) where
 * text is split into individual character/word runs.
 */
export function extractDrawMerged(page: PdfPage, tolerance: number = 0.3): ExtractedDrawData {
  const regions = detectRegions(page, tolerance);

  // Merge fragmented text in content region
  const mergedContent = mergeTextItems(regions.content.items, tolerance);
  const mergedHeader = mergeTextItems(regions.header.items, tolerance);

  // Extract tournament info from merged header
  const metadata: Record<string, string> = {};
  let tournamentName: string | undefined;
  let eventName: string | undefined;

  const sortedHeader = [...mergedHeader].sort((a, b) => b.fontSize - a.fontSize);
  if (sortedHeader.length > 0) {
    tournamentName = sortedHeader[0].text;
    metadata.tournamentName = tournamentName;
  }
  if (sortedHeader.length > 1) {
    eventName = sortedHeader[1].text;
    metadata.eventName = eventName;
  }

  // Extract participants from merged text
  const participants: ExtractedParticipant[] = [];
  const scores: string[] = [];

  for (const item of mergedContent) {
    const { cleanText, seedValue, entryCode } = cleanMergedText(item.text);
    const classified = classifyText(cleanText, item.x, item.y);

    if (classified.type === 'player-name' || (cleanText.length > 5 && extractPlayerName(cleanText))) {
      const parsed = extractPlayerName(cleanText);
      if (parsed) {
        participants.push({
          familyName: parsed.familyName,
          givenName: parsed.givenName,
          seedValue: seedValue ?? extractSeedValue(item.text) ?? undefined,
          entryStatus: entryCode,
        });
      }
    } else if (classified.type === 'score') {
      scores.push(cleanText);
    }
  }

  // Extract round labels
  const roundLabels = mergedContent
    .filter((item) => classifyText(item.text, item.x, item.y).type === 'round-label')
    .map((item) => item.text);

  return {
    tournamentName,
    eventName,
    participants,
    matchUps: scores.map((score, i) => ({ roundNumber: 0, roundPosition: i + 1, score })),
    roundLabels,
    metadata,
  };
}
