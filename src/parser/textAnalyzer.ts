/**
 * Tennis-specific text classification.
 *
 * Analyzes text items extracted from a PDF to identify player names,
 * scores, seeds, entry codes, round labels, country codes, etc.
 *
 * This is a key component for the PDF-to-TODS extraction pipeline.
 */

export type TextType =
  | 'player-name'
  | 'score'
  | 'seed'
  | 'entry-code'
  | 'round-label'
  | 'country-code'
  | 'draw-position'
  | 'tournament-info'
  | 'unknown';

export interface ClassifiedText {
  text: string;
  type: TextType;
  x: number;
  y: number;
  confidence: number;
}

const COUNTRY_CODE_RE = /^[A-Z]{3}$/;
const SCORE_RE = /^\d[/-]\d(\(\d+\))?\s+\d[/-]\d(\(\d+\))?(\s+\d[/-]\d(\(\d+\))?)?$/;
const SCORE_PARTIAL_RE = /^\d[/-]\d(\(\d+\))?$/;
const SEED_BRACKETS_RE = /^\[(\d{1,2})\]$/;
const SEED_PARENS_RE = /^\((\d{1,2})\)$/;
const ENTRY_CODE_RE = /^\(?([A-Z]{1,3})\)?$|^-([A-Z]{1,3})$/;
const DRAW_POSITION_RE = /^\d{1,3}\.?$/;
const PLAYER_NAME_RE = /^[A-Z][A-Z'-]+[,\s]+[A-Za-z][A-Za-z'-]+/;

const ROUND_LABELS = new Set([
  'First Round',
  'Second Round',
  'Third Round',
  'Fourth Round',
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4',
  'Round of 16',
  'Round of 32',
  'Round of 64',
  'Round of 128',
  'Quarter-Finals',
  'Quarter-finals',
  'Quarterfinals',
  'QF',
  'Semi-Finals',
  'Semi-finals',
  'Semifinals',
  'SF',
  'Final',
  'Finals',
  'F',
  '1er TOUR',
  '2eme TOUR',
  '3eme TOUR',
  '1/8 FINALE',
  '1/4 FINALE',
  '1/2 FINALE',
  'FINALE',
  'R16',
  'R32',
  'R64',
  'R128',
]);

const ENTRY_CODES = new Set(['WC', 'Q', 'LL', 'SE', 'A', 'ALT', 'W', 'L', 'DA', 'PR']);
const RETIREMENT_LABELS = new Set(['Ret.', 'RET', 'Ab', 'Ab.', 'ret.', 'Retired']);
const WALKOVER_LABELS = new Set(['w/o', 'W/O', 'w.o.', 'WO']);

export function classifyText(text: string, x: number, y: number): ClassifiedText {
  const trimmed = text.trim();
  if (!trimmed) return { text: trimmed, type: 'unknown', x, y, confidence: 0 };

  // Check round labels first (multi-word matches)
  if (ROUND_LABELS.has(trimmed)) {
    return { text: trimmed, type: 'round-label', x, y, confidence: 0.95 };
  }

  // Score patterns
  if (SCORE_RE.test(trimmed) || isCompoundScore(trimmed)) {
    return { text: trimmed, type: 'score', x, y, confidence: 0.9 };
  }

  if (RETIREMENT_LABELS.has(trimmed) || WALKOVER_LABELS.has(trimmed)) {
    return { text: trimmed, type: 'score', x, y, confidence: 0.85 };
  }

  // Seed in brackets/parens
  if (SEED_BRACKETS_RE.test(trimmed) || SEED_PARENS_RE.test(trimmed)) {
    return { text: trimmed, type: 'seed', x, y, confidence: 0.9 };
  }

  // Country code (exactly 3 uppercase letters)
  if (COUNTRY_CODE_RE.test(trimmed)) {
    // Could also be entry code (WC, LL, etc.)
    if (ENTRY_CODES.has(trimmed)) {
      return { text: trimmed, type: 'entry-code', x, y, confidence: 0.8 };
    }
    return { text: trimmed, type: 'country-code', x, y, confidence: 0.85 };
  }

  // Entry codes (in parens or with hyphen)
  if (ENTRY_CODE_RE.test(trimmed)) {
    return { text: trimmed, type: 'entry-code', x, y, confidence: 0.8 };
  }

  // Draw position number
  if (DRAW_POSITION_RE.test(trimmed) && parseInt(trimmed) <= 256) {
    return { text: trimmed, type: 'draw-position', x, y, confidence: 0.7 };
  }

  // Player name pattern (LASTNAME, Firstname or LASTNAME Firstname)
  if (PLAYER_NAME_RE.test(trimmed) && trimmed.length > 5) {
    return { text: trimmed, type: 'player-name', x, y, confidence: 0.8 };
  }

  return { text: trimmed, type: 'unknown', x, y, confidence: 0.1 };
}

function isCompoundScore(text: string): boolean {
  // Handle scores like "6-4 6-3 6-1" or "6/4 6/3" or "7-6(5) 6-3"
  const parts = text.split(/\s+/);
  if (parts.length < 2 || parts.length > 5) return false;
  return parts.every((p) => SCORE_PARTIAL_RE.test(p) || RETIREMENT_LABELS.has(p) || WALKOVER_LABELS.has(p));
}

export function extractPlayerName(text: string): { familyName: string; givenName: string } | null {
  // "SINNER, Jannik" or "SINNER Jannik"
  const commaMatch = text.match(/^([A-Z][A-Z'-]+),\s*([A-Za-z][A-Za-z'-]+(?:\s+[A-Za-z][A-Za-z'-]+)?)/);
  if (commaMatch) {
    return { familyName: commaMatch[1], givenName: commaMatch[2] };
  }

  const spaceMatch = text.match(/^([A-Z][A-Z'-]+)\s+([A-Za-z][A-Za-z'-]+(?:\s+[A-Za-z][A-Za-z'-]+)?)/);
  if (spaceMatch) {
    return { familyName: spaceMatch[1], givenName: spaceMatch[2] };
  }

  return null;
}

export function extractSeedValue(text: string): number | null {
  const bracketMatch = text.match(/\[(\d+)\]/);
  if (bracketMatch) return parseInt(bracketMatch[1]);
  const parenMatch = text.match(/\((\d+)\)/);
  if (parenMatch) return parseInt(parenMatch[1]);
  return null;
}
