import type { DrawFormatConfig } from '../config/types';
import type { DrawSlot } from '../core/extractDrawData';

export function formatPlayerEntry(slot: DrawSlot, config: DrawFormatConfig): string {
  if (slot.isBye) return 'Bye';
  if (!slot.participantName) return '';

  const name = formatName(slot.participantName, config);
  const nat = formatNationality(slot.nationality, config);
  const seed = slot.seedValue ? formatSeed(slot.seedValue, config) : '';
  const entry = slot.entryStatus ? formatEntryStatus(slot.entryStatus, config) : '';

  const parts: string[] = [];

  if (config.seedPosition === 'before-position' && seed) parts.push(seed);
  parts.push(name);
  if (config.seedPosition === 'after-name' && seed) parts.push(seed);
  if (nat) parts.push(nat);
  if (config.seedPosition === 'after-country' && seed) parts.push(seed);
  if (entry) parts.push(entry);

  return parts.join(' ');
}

/** Returns name (with seed/entry) and nationality as separate strings for split rendering */
export function formatPlayerEntrySplit(
  slot: DrawSlot,
  config: DrawFormatConfig,
): { name: string; nationality: string } {
  if (slot.isBye) return { name: 'Bye', nationality: '' };
  if (!slot.participantName) return { name: '', nationality: '' };

  const name = formatName(slot.participantName, config);
  const seed = slot.seedValue ? formatSeed(slot.seedValue, config) : '';
  const entry = slot.entryStatus ? formatEntryStatus(slot.entryStatus, config) : '';

  const parts: string[] = [];
  if (config.seedPosition === 'before-position' && seed) parts.push(seed);
  parts.push(name);
  if (config.seedPosition === 'after-name' && seed) parts.push(seed);
  if (config.seedPosition === 'after-country' && seed) parts.push(seed);
  if (entry) parts.push(entry);

  return { name: parts.join(' '), nationality: slot.nationality || '' };
}

function formatName(participantName: string, config: DrawFormatConfig): string {
  // participantName comes as "LASTNAME, GivenName" from extractDrawData
  if (config.nameFormat === 'LAST First') {
    return participantName.replace(',', '');
  }
  if (config.nameFormat === 'F. LAST') {
    const match = participantName.match(/^([^,]+),\s*(.+)/);
    if (match) return `${match[2][0]}. ${match[1]}`;
  }
  return participantName;
}

function formatNationality(nat: string, config: DrawFormatConfig): string {
  if (!nat) return '';
  switch (config.nationalityFormat) {
    case 'parens':
      return `(${nat})`;
    case 'hyphen':
      return `-${nat}`;
    default:
      return nat;
  }
}

function formatSeed(seedValue: number, config: DrawFormatConfig): string {
  return config.seedFormat === 'parens' ? `(${seedValue})` : `[${seedValue}]`;
}

const ENTRY_ABBREVIATIONS: Record<string, string> = {
  DIRECT_ACCEPTANCE: '',
  WILDCARD: 'WC',
  QUALIFIER: 'Q',
  LUCKY_LOSER: 'LL',
  SPECIAL_EXEMPT: 'SE',
  ALTERNATE: 'ALT',
  PROTECTED_RANKING: 'PR',
  JUNIOR_EXEMPT: 'JE',
  ORGANISER_ACCEPTANCE: 'OA',
};

function formatEntryStatus(entryStatus: string, config: DrawFormatConfig): string {
  if (!entryStatus) return '';
  const abbr = ENTRY_ABBREVIATIONS[entryStatus];
  if (abbr === undefined) return entryStatus;
  if (!abbr) return ''; // DIRECT_ACCEPTANCE → no badge
  switch (config.entryFormat) {
    case 'parens':
      return `(${abbr})`;
    case 'hyphen':
      return `-${abbr}`;
    default:
      return abbr;
  }
}

export function formatMatchScore(score: string, config: DrawFormatConfig): string {
  if (!score) return '';
  // The score from the factory comes with hyphens as game separators
  // Convert to the preset's format if needed
  if (config.gameScoreSeparator === '/') {
    return score.replace(/(\d)-(\d)/g, `$1/$2`);
  }
  return score;
}
